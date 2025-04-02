import { AudioFile, CharLine, Clip, createClip, Line, LineKind, MusicLine, MusicType } from '@shared/line.js';
import { textToSpeech, processCharacterVoices } from '@pod/pass_voice.js';
import { musicChooser } from '@pod/audio_chooser.js';
import { getAudioDuration } from '@pod/process_audio.js';
import { usefulTrack } from '@shared/music.js';
import { improvedSaveMusicAsAudio } from '@pod/save_track.js';
import { fetchTracks, fetchEpidemicSFX } from '@pod/pass_music.js';
import { Readable } from 'stream';
import { saveStreamToFile } from '@pod/local.js';
import { TEMP_DATA_PATH } from '@pod/init.js';
import { Character } from '@shared/voice.js';
import { Script } from '@shared/script.js';
import path from 'path';

/** 
 * Create audio file for a character line and save it to the temp data path
 */
export async function processCharacterLine(current_line: CharLine, prev_line: CharLine | null,
    next_line: CharLine | null, current_character: Character, runningStartTime: number): Promise<AudioFile> {
    let stream = await processCharacterDialogue(current_line, prev_line, next_line, current_character.voice_model);
    let fileName = `${current_line.id}.mp3`;
    let url = path.join(TEMP_DATA_PATH, 'dialogue', fileName);
    await saveStreamToFile(stream, url);
    let duration = await getAudioDuration(url);
    let audio = new AudioFile(current_line.id, url, runningStartTime, duration);
    return audio;
}


export function prevAndNextCharLines(line: CharLine, script: Script) {
    // get the previous and next character lines
    let prev_char_line = null;
    let next_char_line = null;

    // Find the previous character line
    for (let j = line.order - 1; j >= 0; j--) {
        if (script.lines[j] instanceof CharLine) {
            prev_char_line = script.lines[j] as CharLine;
            break;
        }
    }

    // Find the next character line
    for (let j = line.order + 1; j < script.lines.length; j++) {
        if (script.lines[j] instanceof CharLine) {
            next_char_line = script.lines[j] as CharLine;
            break;
        }
    }
    return { "prev": prev_char_line, "next": next_char_line };
}



/** 
 * processCharacterDialogue
 * a character is going to speak in this line
*/
export async function processCharacterDialogue(line: CharLine, prev_line: CharLine | null, next_line: CharLine | null, voice_model: string): Promise<Readable> {
    let prev_dialogue = "";
    let next_dialogue = "";
    let dialogue = line.dialogue;
    let character = line.character;
    if (prev_line != null && character == prev_line.character) {
        prev_dialogue = prev_line.dialogue;
    }
    if (next_line != null && character == next_line.character) {
        next_dialogue = next_line.dialogue;
    }

    dialogue = dialogue.trim();
    // try 3 times 
    let lastError: Error;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            // On first attempt, use all context. On subsequent attempts, simplify the request
            if (attempt === 1) {
                const response = await textToSpeech(voice_model, dialogue, prev_dialogue, next_dialogue, line.adjective);
                return response;
            } else {
                console.log(`Retrying with simplified request for ${character}`);
                const response = await textToSpeech(voice_model, dialogue, "", "", "");
                return response;
            }
        } catch (error) {
            console.error(`Attempt ${attempt} failed for character ${character}:`, error);
            lastError = error;
            if (attempt === 3) {
                throw new Error(`Failed to process dialogue after 3 attempts: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    throw lastError;
}



export async function processMusicLine(line: MusicLine, script: Script, theme_tracks: usefulTrack[]): Promise<AudioFile> {
    let audio: AudioFile | null = null;
    if (line.type == MusicType.BMusic) {
        audio = await processBMusicLine(line, script, theme_tracks);
    } else if (line.type == MusicType.SFX) {
        audio = await processSFXMusicLine(line)
    } else {
        throw `error, found line with bad type: ${line}`;
    }

    return audio;
}

/**
 * processMusicLine
 * An audio clip is going to play during this line
 */
export async function processBMusicLine(music_line: MusicLine, script: Script, theme_tracks: usefulTrack[]): Promise<AudioFile> {
    let line_order = music_line.order;
    let dialogue_desc = "";

    // if theme tracks are provided, use them
    if (theme_tracks.length > 0) {
        return await improvedSaveMusicAsAudio(theme_tracks, music_line.id);
    }
    // normal case
    if (line_order < script.lines.length && script.lines[line_order] instanceof CharLine) {
        dialogue_desc = script.lines[line_order].dialogue;
    }
    console.log(`dialogue_desc: ${dialogue_desc}`);
    let music_choice: { genre?: string, mood?: string, duration?: number } = await musicChooser(music_line.music_description, dialogue_desc)
    if (music_choice == undefined) {
        throw `error, music_choice is undefined`;
    }
    let tracks: usefulTrack[] = await fetchTracks(music_choice.genre, music_choice.mood);
    if (tracks == undefined) {
        throw `error, tracks is undefined`;
    }
    if (music_choice.duration == undefined) {
        throw `error, music_choice.duration is undefined`;
    }
    return await improvedSaveMusicAsAudio(tracks, music_line.id);
}

/**
 * processMusicLine
 * An audio clip is going to play during this line
 */
export async function processSFXMusicLine(music_line: MusicLine): Promise<AudioFile> {
    let tracks: usefulTrack[] = await fetchEpidemicSFX(music_line.music_description);
    return await improvedSaveMusicAsAudio(tracks, music_line.id);
}

async function processWithRetry<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    maxRetries = 3,
    logErrors = false
): Promise<T> {
    let lastError: Error;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (logErrors) {
                console.error(`${errorMessage} - Attempt ${i + 1} failed:`, error);
            }
        }
    }
    throw new Error(`${errorMessage} after ${maxRetries} attempts: ${lastError.message}`);
}

export async function processLine(line: Line, script: Script, characters: Character[], 
    runningTime: number, theme_tracks: usefulTrack[]): Promise<Clip> {
    if (line.kind == LineKind.CHARACTER) {
        return await processWithRetry(
            async () => {
                const current_character = characters.find((char) => char.name === (line as CharLine).character);
                if (!current_character) {
                    throw new Error(`Character ${(line as CharLine).character} not found`);
                }

                const pn_chars = prevAndNextCharLines(line as CharLine, script);
                const audio = await processCharacterLine(line as CharLine, pn_chars.prev, pn_chars.next, current_character, runningTime);
                return createClip(audio, line as CharLine);
            },
            'Failed to process character line'
        );
    } else if (line.kind == LineKind.MUSIC) {
        return null;
        // return await processWithRetry(
        //     async () => {
        //         const music_processed = await processMusicLine(line as MusicLine, script, theme_tracks);
        //         return createClip(music_processed, line as MusicLine);
        //     },
        //     'Failed to process music line',
        //     3,
        //     true
        // );
    } else {
        throw `error, found line with bad kind: ${line}`;
    }
}