import { uploadFileToS3, getFileFromS3, uploadAudioToS3 } from './pass_files.js';
import { CharLine, Clip, MusicLine } from '@shared/line';
import { Script } from '@shared/script';
import { v4 as uuidv4 } from 'uuid';
import { processCharacterLines, processMusicLines, processMusicLine, processCharacterLine, prevAndNextCharLines, processLine } from './process_line.js';
import { deleteAllFilesInFolder, saveAsJson } from './local.js';
import { TEMP_DATA_PATH } from './init.js';
import { processCharacterVoices } from './pass_voice.js';
import { parallelMerge } from './process_merging.js';
import path from 'path';
import fs from 'fs';
import { saveClipToLogs } from './local.js'; // Add this import at the top of the file
import { Request, Response, Express } from 'express';
import fsPromises from 'fs/promises';
import { ProcessingStatus, ProcessingStep } from '@shared/processing.js';
import { updateMongoData } from '@/mongo_methods.js';
import { ObjectId } from 'bson';
import { PodStatus } from '@shared/pods.js';

/**
 * createPodcastInParallel
 * In each iteration, process a character line and music line to update audio file
 */
export async function createPodInParallel(script: Script, pod_id: string, res: Response) {
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

        // const script_data = await getScript(script_path, script_path, true);
        // if (script_data.status === ProcessingStatus.ERROR || !script_data.script) {
        //     return {
        //         status: ProcessingStatus.ERROR,
        //         step: "podcast",
        //         message: script_data.message
        //     } as ProcessingStep;
        // }

        // const script = script_data.script;
        
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
                console.log(`clip: ${clip}`);
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
        for (const clip of cur_clips) {
            saveClipToLogs(clip, './logs', 'pod_logs');
        }
        // Final merge if there are remaining clips
        if (cur_clips.length > 0) {
            runningTime = await mergeAndCleanup(cur_clips, pod_id, runningTime, script, res);
        }

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

        await uploadAudioToS3(`${resultFileName}.wav`);
        await updateMongoData('pods', {
            _id: new ObjectId(resultFileName),
            audio_key: `pod-audio/${resultFileName}.wav`,
            status: PodStatus.READY
        });
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


/**
 * Delete temp files that are used in processing
 */
export function deleteTempFiles() {
    deleteAllFilesInFolder(TEMP_DATA_PATH + '/dialogue');
    deleteAllFilesInFolder(TEMP_DATA_PATH + '/character');
    deleteAllFilesInFolder(TEMP_DATA_PATH + '/character-temp');
    deleteAllFilesInFolder(TEMP_DATA_PATH + '/music');
    deleteAllFilesInFolder(TEMP_DATA_PATH + '/music-temp');
    deleteAllFilesInFolder(TEMP_DATA_PATH + '/result');
}
