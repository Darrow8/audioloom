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
            trim_filter.push(`[a${input_count}]atrim=duration=${clip.audio.duration}[b${input_count}];`);
            start_filter.push(`[b${input_count}]adelay=${clip.audio.start * 1000}|${clip.audio.start * 1000}[c${input_count}];`);
            runningTime = Number((runningTime + clip.audio.duration).toFixed(2));
        } else if (clip.line.kind === LineKind.MUSIC) {
            // For non-dialogue clips, just pass through without volume adjustment
            let nearest_char_duration = getNearestAfterCharDuration(i, cur_clips);
            let music_filter = getMusicFilter(clip, global_volume, runningTime, nearest_char_duration, script);
            volume_filter.push(`[${input_count}:a]volume=${music_filter.volume}${music_filter.fade.length > 0 ? ',' + music_filter.fade : ''}[a${input_count}];`);
            trim_filter.push(`[a${input_count}]atrim=duration=${music_filter.duration}[b${input_count}];`);
            start_filter.push(`[b${input_count}]adelay=${music_filter.start}|${music_filter.start}[c${input_count}];`);
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
                // Optional: Add progress reporting here
            })
            .on('end', () => {
                console.log('Finished processing');
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
 * Returns nearest char duration after the current music clip in seconds
 */
function getNearestAfterCharDuration(start: number, cur_clips: Clip[]) {
    for (let i = start; i < cur_clips.length; i++) {
        if (cur_clips[i].line instanceof CharLine) {
            return cur_clips[i].audio.duration;
        }
    }
    return 10; // default duration
}

/**
 * adelay expects delay values in milliseconds.
    atrim expects duration values in seconds.
 */
function getMusicFilter(mclip: Clip, char_volume: number, runningTime: number, nearestCharDuration: number, script: Script) {
    let musicVolume = 0;
    let durationMs = -1;

    if(mclip.audio.rawDuration && mclip.audio.rawDuration > 0){
        durationMs = (mclip.audio.rawDuration * 1000);
    }else if(mclip.audio.duration && mclip.audio.duration > 0){
        durationMs = (mclip.audio.duration * 1000) + 10000;
    }else{
        durationMs = (nearestCharDuration * 1000) + 10000;
    }

    const aud_type = (mclip.line as MusicLine).type;
    let percent_volume = 0.3;
    if (aud_type === MusicType.BMusic) {
        // if the next line is a character line, then we need to make sure the music clip is longer than the character line
        let next_line = script.lines.find((line) => line.order == mclip.line.order + 1);       
        // cap at 60 seconds extra
        if(next_line){
            if (durationMs > nearestCharDuration + 60000) {
                durationMs = nearestCharDuration + 60000;
            }
        }
        // if (next_line && 'character' in next_line) {
        //     // cap at 60 seconds extra
        //     if (durationMs > nearestCharDuration + 60000) {
        //         durationMs = nearestCharDuration + 60000;
        //     }
        // } else {
        //     // cap at 25 seconds extra
        //     if (durationMs > nearestCharDuration + 25000) {
        //         durationMs = nearestCharDuration + 25000;
        //     }
        // }
    } else if (aud_type === MusicType.SFX) {
        musicVolume = char_volume * percent_volume;
        // if the sound effect clip is longer than 15 seconds, then we need to add a fade in and fade out and cap at 15 seconds
        if (durationMs > 1000 * 15) {
            // cap the duration of music to 15 seconds
            durationMs = 1000 * 15;
        }
    }

    // Move fade calculation after duration capping
    let fade = getFadeInAndOutDuration(durationMs);

    return {
        volume: musicVolume,
        duration: durationMs / 1000,
        start: Math.max(0, runningTime * 1000),
        fade: fade,
    };
}

/*
 Only add fade in and fade out if the duration is longer than 10 seconds
*/
function getFadeInAndOutDuration(durationMs: number) {
    // Don't apply fades for clips shorter than 3 seconds
    if (durationMs < 5000) {
        return '';
    }
    // For longer clips, use up to 1/4 of duration, capped at 6 seconds
    const fadeInDuration = durationMs / 4;
    const fadeOutDuration = durationMs / 4;
    const fadeOutStart = durationMs - fadeOutDuration;
    return `afade=t=in:st=0:d=${(fadeInDuration / 1000).toFixed(2)}:curve=exp,afade=t=out:st=${(fadeOutStart / 1000).toFixed(2)}:d=${(fadeOutDuration / 1000).toFixed(2)}:curve=exp`;
}