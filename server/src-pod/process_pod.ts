import { uploadFileToS3, getFileFromS3, uploadAudioToS3 } from '@pod/pass_files.js';
import { CharLine, Clip, MusicLine } from '@shared/line.js';
import { Script } from '@shared/script.js';
import { v4 as uuidv4 } from 'uuid';
import { processLine } from '@pod/process_line.js';
import { deleteAllFilesInFolder, saveAsJson } from '@pod/local.js';
import { TEMP_DATA_PATH } from '@pod/init.js';
import { processCharacterVoices } from '@pod/pass_voice.js';
import { parallelMerge } from '@pod/process_merging.js';
import path from 'path';
import fs from 'fs';
import { saveClipToLogs } from '@pod/local.js'; // Add this import at the top of the file
import { Request, Response, Express } from 'express';
import fsPromises from 'fs/promises';
import { ProcessingStatus, ProcessingStep } from '@shared/processing.js';
import { updateMongoData } from '@db/mongo_methods.js';
import { ObjectId } from 'bson';
import { PodStatus } from '@shared/pods.js';

/**
 * createPodcastInParallel
 * In each iteration, process a character line and music line to update audio file
 */
export async function createPodInParallel(script: Script, pod_id: string, res: Response, mode: "prod" | "dev") {
    const tempFiles: string[] = [];
    try {
        // Validate script path
        if (!script) {
            return {
                status: ProcessingStatus.ERROR,
                step: "podcast",
                message: "Invalid script path. Must be a .txt file"
            } as ProcessingStep;
        }
        
        // Process characters with validation
        const characters_str = new Set(script.getCharLines().map(line => line.character));
        if (characters_str.size === 0) {
            return {
                status: ProcessingStatus.ERROR,
                step: "podcast",
                message: "No characters found in script"
            } as ProcessingStep;
        }

        const characters = await processCharacterVoices(Array.from(characters_str));
        let runningTime = 0;
        let cur_clips: Clip[] = [];
        
        // Process lines with progress updates
        for (let i = 0; i < script.lines.length; i++) {
            try {
                const line = script.lines[i];
                const progressUpdate = {
                    status: ProcessingStatus.IN_PROGRESS,
                    step: "podcast",
                    progress: Math.round((i / script.lines.length) * 100),
                    message: `Processing line ${i + 1} of ${script.lines.length}`
                };
                res.write(JSON.stringify(progressUpdate));
                const clip = await processLine(line, script, characters, runningTime);
                if (clip != null && clip != undefined) {
                    cur_clips.push(clip);
                    tempFiles.push(clip.audio.url);
                    if (shouldMergeClips(cur_clips)) {
                        runningTime = await mergeAndCleanup(cur_clips, pod_id, runningTime, script, res);
                        cur_clips = [];
                    }
                }else {
                    console.log(`clip is null or undefined, skipping`);
                }
            } catch (error) {
                console.error(`Error processing line ${i}:`, error);
                throw new Error(`Failed to process line ${i}: ${error.message}`);
            }
        }

        // save clips to logs
        for (const clip of cur_clips) {
            saveClipToLogs(clip, `pod_${pod_id}_id_${clip.line.id}`);
        }

        await uploadAudioToS3(`${pod_id}.wav`);
        await updateMongoData('pods', {
            _id: new ObjectId(pod_id),
            audio_key: `pod-audio/${pod_id}.wav`,
            status: PodStatus.PENDING
        }, mode);

        return {
            status: ProcessingStatus.COMPLETED,
            step: "podcast",
            duration: runningTime,
            filename: `${pod_id}.wav`
        } as ProcessingStep;

    } catch (error) {
        console.error('Error in createPodInParallel:', error);
        return {
            status: ProcessingStatus.ERROR,
            step: "podcast",
            message: error.message
        } as ProcessingStep;
    } finally {
        // Cleanup temp files
        await cleanupTempFiles(tempFiles);
    }
}

async function mergeAndCleanup(
    clips: Clip[], 
    resultFileName: string, 
    runningTime: number, 
    script: Script,
    res: Response
): Promise<number> {
    const resultPath = path.join(TEMP_DATA_PATH, 'result', `${resultFileName}.wav`);
    
    try {
        runningTime = await parallelMerge(runningTime, clips, resultFileName, script);
        
        // Verify file exists and is valid
        if (!fs.existsSync(resultPath)) {
            throw new Error(`Result file not found: ${resultPath}`);
        }

        const fileStats = await fs.promises.stat(resultPath);
        if (fileStats.size === 0) {
            throw new Error('Generated file is empty');
        }
        // TODO: When we want to do quicker production we can upload to S3 here
        // await uploadAudioToS3(`${resultFileName}.wav`);
        // await updateMongoData('pods', {
        //     _id: new ObjectId(resultFileName),
        //     audio_key: `pod-audio/${resultFileName}.wav`,
        //     status: PodStatus.PENDING
        // });
        res.write(JSON.stringify({
            status: ProcessingStatus.IN_PROGRESS,
            step: "podcast",
            duration: runningTime,
            message: "Merged audio chunk successfully"
        }));

        return runningTime;

    } catch (error) {
        throw new Error(`Failed to merge audio: ${error.message}`);
    }
}

async function cleanupTempFiles(files: string[]) {
    for (const file of files) {
        try {
            if (fs.existsSync(file)) {
                await fs.promises.unlink(file);
            }
        } catch (error) {
            console.error(`Failed to delete temp file ${file}:`, error);
        }
    }
}

function shouldMergeClips(clips: Clip[]): boolean {
    return clips.length > 0 && 
           'dialogue' in clips[clips.length - 1].line &&
           (clips[clips.length - 1].line as CharLine).dialogue?.length > 0;
}



