import { uploadFileToS3, getFileFromS3, uploadAudioToS3 } from '@pod/s3_files.js';
import { AudioFile, CharLine, Clip, MusicLine } from '@shared/line.js';
import { Script } from '@shared/script.js';
import { v4 as uuidv4 } from 'uuid';
import { processLine } from '@pod/process_line.js';
import { deleteAllFilesInFolder, saveAsJson } from '@pod/local.js';
import { TEMP_DATA_PATH } from '@pod/init.js';
import { processCharacterVoices } from '@pod/pass_voice.js';
import { parallelMerge } from '@pod/process_merging.js';
import path from 'path';
import fs from 'fs';
import { saveClipsToLogs } from '@pod/local.js'; // Add this import at the top of the file
import { Request, Response, Express } from 'express';
import fsPromises from 'fs/promises';
import { ProcessingStatus, ProcessingStep } from '@shared/processing.js';
import { updateMongoData } from '@db/mongo_methods.js';
import { ObjectId } from 'bson';
import { PodStatus } from '@shared/pods.js';
import { sendOneSignalNotification } from '@pod/sender.js';
import { Music_Choice } from '@pod/audio_chooser.js';
import { usefulTrack } from '@shared/music';
import { fetchTracks } from '@pod/pass_music.js';

/**
 * createPodcastInParallel
 * In each iteration, process a character line and music line to update audio file
 */
export async function createPodInParallel(script: Script, pod_id: string, res: Response, mode: "prod" | "dev", theme: Music_Choice) {
    const tempFiles: string[] = [];
    try {
        const characters_str = new Set(script.getCharLines().map(line => line.character));
        const characters = await processCharacterVoices(Array.from(characters_str));
        let runningTime = 0;
        let cur_clips: Clip[] = [];
        let theme_tracks: usefulTrack[] = await fetchTracks(theme.genre, theme.mood);
        for (let i = 0; i < script.lines.length; i++) {
            const line = script.lines[i];
            const clip = await processLine(line, script, characters, runningTime, theme_tracks);
            if (clip != null && clip != undefined) {
                cur_clips.push(clip);
                tempFiles.push(clip.audio.url);
                if (shouldMergeClips(cur_clips)) {
                    let mergeResult = await parallelMerge(runningTime, cur_clips, pod_id, script);
                    if (mergeResult.status === ProcessingStatus.ERROR) {
                        return mergeResult;
                    }
                    runningTime = mergeResult.duration;
                    cur_clips = [];
                }
            } else {
                console.error(`clip is null or undefined, skipping`);
            }
        }
        await cleanupTempFiles(tempFiles);
        return {
            status: ProcessingStatus.SUCCESS,
            step: "podcast",
            duration: runningTime,
            filename: `${pod_id}.wav`,
            message: "Podcast created successfully"
        } as ProcessingStep;

    } catch (error) {
        await cleanupTempFiles(tempFiles);
        return {
            status: ProcessingStatus.ERROR,
            step: "podcast",
            message: error.message
        } as ProcessingStep;
    }
}

async function cleanupTempFiles(files: string[]) {
    if (process.env.UNLINK_FILES === 'true') {
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
}

function shouldMergeClips(clips: Clip[]): boolean {
    return clips.length > 0 &&
        'dialogue' in clips[clips.length - 1].line &&
        (clips[clips.length - 1].line as CharLine).dialogue?.length > 0;
}