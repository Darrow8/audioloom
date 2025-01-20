import { TEMP_DATA_PATH } from "@pod/init.js";
import { Clip, MusicLine, CharLine, MusicType } from "@shared/line.js";
import { Script } from "@shared/script.js";
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { normalizeAudioInPlace } from "@pod/process_normalize.js";
import { LineKind } from "@shared/line.js";

/**
 * parallelMerge
 * 
 * Merge audio clips in parallel
 */
export async function parallelMerge(runningTime: number, cur_clips: Clip[], filename: string, script: Script): Promise<number> {
    const original = path.join(TEMP_DATA_PATH, 'result', `${filename}.wav`);
    const temp = path.join(TEMP_DATA_PATH, 'result', `${filename}-temp.wav`);

    // for (const clip of cur_clips) {
    //     await normalizeAudioInPlace(clip.audio.url);
    // }

    // Perform merge process
    runningTime = await parallelMergeProcess(runningTime, cur_clips, original, temp, script);

    // Clean up
    if (fs.existsSync(original)) {
        await fsPromises.unlink(original);
    }
    await fsPromises.rename(temp, original);

    return runningTime;
}


async function parallelMergeProcess(runningTime: number, cur_clips: Clip[], input: string, output: string, script: Script) {

    let input_count = 0;
    const command = ffmpeg();

    let start_filter = []; // step a
    let trim_filter = []; // step b
    let volume_filter = []; // step c
    let global_volume = 1;

    // Include the existing audio file as input only if it exists and runningTime > 0
    if (runningTime > 0 && fs.existsSync(input)) {
        command.input(input);
        // skip from a to c because we don't need to trim the duration or delay the start
        volume_filter.push(`[${input_count}:a]volume=${global_volume}[c${input_count}];`);
        input_count++;
    }


    // Add new clips as inputs
    for (let i = 0; i < cur_clips.length; i++) {
        const clip = cur_clips[i];
        command.input(clip.audio.url);
        if (clip.line.kind === LineKind.CHARACTER) {
            if (clip.audio.start == -1) {
                clip.audio.start = runningTime;
            }
            volume_filter.push(`[${input_count}:a]volume=${global_volume}[a${input_count}];`);
            start_filter.push(`[b${input_count}]adelay=${clip.audio.start * 1000}|${clip.audio.start * 1000}[c${input_count}];`);
            trim_filter.push(`[a${input_count}]atrim=duration=${clip.audio.duration}[b${input_count}];`);
            runningTime = Number((runningTime + clip.audio.duration).toFixed(2));
        } else if (clip.line.kind === LineKind.MUSIC) {
            // For non-dialogue clips, just pass through without volume adjustment
            let nearest_char_duration = getNearestAfterCharDuration(i, cur_clips);
            let music_filter = getMusicFilter(clip, global_volume, runningTime, nearest_char_duration, script);
            volume_filter.push(`[${input_count}:a]volume=${music_filter.volume}${music_filter.fade.length > 0 ? ',' + music_filter.fade : ''}[a${input_count}];`);
            start_filter.push(`[b${input_count}]adelay=${music_filter.start}|${music_filter.start}[c${input_count}];`);
            trim_filter.push(`[a${input_count}]atrim=duration=${music_filter.duration}[b${input_count}];`);
        }
        input_count++;
    }

    // Get the total number of inputs

    // Construct filter_complex for concatenation
    const filterInputs = [...Array(input_count).keys()].map(i => `[c${i}]`).join('');
    // order here matters, volume first, then adelay, then atrim
    const filterComplex = `${volume_filter.join('')}${start_filter.join('')}${trim_filter.join('')}${filterInputs}amix=inputs=${input_count}:duration=longest:dropout_transition=0:normalize=0[outa]`;

    // Set output options
    command.complexFilter(filterComplex)
        .outputOptions('-map [outa]')
        .audioCodec('pcm_s16le')  // Use WAV codec for intermediate file
        .audioChannels(2)
        .audioFrequency(44100)
        .output(output);

    return new Promise<number>((resolve, reject) => {
        command
            .on('start', (cmd) => {
                console.log(`Started: ${cmd}`);
            })
            .on('progress', (progress) => {
                console.log(`Progress: ${progress.timemark}`);
            })
            .on('end', () => {
                console.log(`Finished processing file ${output}`);
                resolve(runningTime);
            })
            .on('error', (err) => {
                console.error('Error:', err);
                reject(err);
            })
            .run();
    });
}

/**
 * Returns the duration of the nearest character line after the given index.
 * Used to determine appropriate durations for music and sound effects.
 * 
 * @param start - Starting index in the clips array
 * @param cur_clips - Array of audio clips
 * @param defaultDuration - Optional default duration in seconds if no character line is found
 * @returns Duration in seconds of the nearest character line, or default duration if none found
 */
function getNearestAfterCharDuration(start: number, cur_clips: Clip[], defaultDuration: number = 60): number {
    // Input validation
    if (!Array.isArray(cur_clips) || start < 0 || start >= cur_clips.length) {
        return defaultDuration;
    }

    // Find the next character line
    for (let i = start; i < cur_clips.length; i++) {
        const clip = cur_clips[i];
        if (!clip?.line) continue;  // Skip if clip or line is undefined
        
        if (clip.line instanceof CharLine && clip.audio?.duration > 0) {
            return clip.audio.duration;
        }
    }

    return defaultDuration;
}

/**
 * adelay expects delay values in milliseconds.
    atrim expects duration values in seconds.
 */
function getMusicFilter(mclip: Clip, char_volume: number, runningTime: number, nearestCharDuration: number, script: Script) {
    const MUSIC_VOLUME = 0.25;
    const MS_TO_SEC = 1000;
    const PADDING_MS = 10000;
    const MAX_SFX_DURATION_MS = 15 * MS_TO_SEC;
    const MAX_MUSIC_AFTER_CHAR_MS = 60 * MS_TO_SEC;
    const MAX_MUSIC_NO_CHAR_MS = 25 * MS_TO_SEC;

    // Calculate initial duration
    let durationMs = calculateInitialDuration(mclip, nearestCharDuration);

    // Apply type-specific duration limits
    const aud_type = (mclip.line as MusicLine).type;
    if (aud_type === MusicType.BMusic) {
        let next_line = script.lines.find((line) => line.order == mclip.line.order + 1);
        
        // Different caps based on whether next line exists and is a character line
        if (next_line) {
            const isCharacterLine = 'character' in next_line;
            const maxExtra = isCharacterLine ? MAX_MUSIC_AFTER_CHAR_MS : MAX_MUSIC_NO_CHAR_MS;
            durationMs = Math.min(durationMs, nearestCharDuration * MS_TO_SEC + maxExtra);
        }
    } else if (aud_type === MusicType.SFX) {
        durationMs = Math.min(durationMs, MAX_SFX_DURATION_MS);
    }

    return {
        volume: MUSIC_VOLUME,
        duration: durationMs / MS_TO_SEC,
        start: Math.max(0, runningTime * MS_TO_SEC),
        fade: getFadeInAndOutDuration(durationMs),
    };
}

function calculateInitialDuration(clip: Clip, nearestCharDuration: number): number {
    const PADDING_MS = 10000;
    
    if (clip.audio.rawDuration && clip.audio.rawDuration > 0) {
        return clip.audio.rawDuration * 1000;
    }
    if (clip.audio.duration && clip.audio.duration > 0) {
        return (clip.audio.duration * 1000) + PADDING_MS;
    }
    return (nearestCharDuration * 1000) + PADDING_MS;
}

/*
 Only add fade in and fade out if the duration is longer than 10 seconds
*/
function getFadeInAndOutDuration(durationMs: number) {
    // Don't apply fades for clips shorter than 5 seconds
    if (durationMs < 5000) {
        return '';
    }
    // For longer clips, use up to 1/4 of duration, capped at 6 seconds
    const fadeInDuration = durationMs / 4;
    const fadeOutDuration = durationMs / 4;
    const fadeOutStart = durationMs - fadeOutDuration;
    return `afade=t=in:st=0:d=${(fadeInDuration / 1000).toFixed(2)}:curve=exp,afade=t=out:st=${(fadeOutStart / 1000).toFixed(2)}:d=${(fadeOutDuration / 1000).toFixed(2)}:curve=exp`;
}