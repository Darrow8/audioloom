import { AudioFile, CharLine, Clip, createClip, Line, MusicLine, MusicType } from '@shared/line.js';
import { textToSpeech, processCharacterVoices } from '@pod/pass_voice.js';
import { musicChooser } from '@pod/process_track.js';
import { getAudioDuration } from '@pod/process_audio.js';
import { usefulTrack } from '@shared/music.js';
import { saveMusicAsAudio } from '@pod/save_track.js';
import { fetchTracks, fetchEpidemicSFX } from '@pod/pass_music.js';
import { Readable } from 'stream';
import { saveStreamToFile } from '@pod/local.js';
import { TEMP_DATA_PATH } from '@pod/init.js';
import { Character } from '@shared/voice.js';
import { ScriptType, Script } from '@shared/script.js';
import path from 'path';

/**
 * Create audio file for a character line and save it to the temp data path
 */
export async function processCharacterLine(current_line: CharLine, prev_line: CharLine | null, 
    next_line: CharLine | null, current_character: Character, runningStartTime: number) : Promise<AudioFile> {
    let stream = await processCharacterDialogue(current_line, prev_line, next_line, current_character.voice_model);
    let fileName = `${current_line.id}.mp3`;
    let url = path.join(TEMP_DATA_PATH, 'dialogue', fileName);
    await saveStreamToFile(stream, url);
    let duration = await getAudioDuration(url);
    let audio = new AudioFile(current_line.id, url, runningStartTime, duration, duration);
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

    return await textToSpeech(voice_model, dialogue, prev_dialogue, next_dialogue, line.adjective);

}



export async function processMusicLine(line: MusicLine, script: Script): Promise<AudioFile> {
    let audio: AudioFile | null = null;
    if (line.type == MusicType.BMusic) {
        audio = await processBMusicLine(line, script);
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
export async function processBMusicLine(music_line: MusicLine, script: Script): Promise<AudioFile> {
    let line_order = music_line.order;
    let dialogue_desc = "";
    if (line_order < script.lines.length) {
        dialogue_desc = script.lines[line_order].raw_string;
    }
    console.log(`dialogue_desc: ${dialogue_desc}`);
    let music_choice = await musicChooser(music_line.music_description, dialogue_desc)

    let tracks: usefulTrack[] = await fetchTracks(music_choice.genre, music_choice.mood);

    return await saveMusicAsAudio(tracks, music_line.id);
}

/**
 * processMusicLine
 * An audio clip is going to play during this line
 */
export async function processSFXMusicLine(music_line: MusicLine): Promise<AudioFile> {
    let tracks: usefulTrack[] = await fetchEpidemicSFX(music_line.music_description);
    return await saveMusicAsAudio(tracks, music_line.id);
}


export async function processLine(
    line: Line, 
    script: Script, 
    characters: Character[], 
    runningTime: number
): Promise<Clip | null> {
    if (line.kind == "character") {
        return await processCharacterLineWithRetry(line as CharLine, script, characters, runningTime);
    } else if (line.kind == "music") {
        return await processMusicLineWithRetry(line as MusicLine, script);
    } else {
        throw `error, found line with bad kind: ${line}`;
    }
}

export async function processCharacterLineWithRetry(
    line: CharLine, 
    script: Script, 
    characters: Character[], 
    runningTime: number,
    maxRetries = 3
): Promise<Clip> {
    let lastError: Error;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const current_character = characters.find((char) => char.name === line.character);
            if (!current_character) {
                throw new Error(`Character ${line.character} not found`);
            }
            
            const pn_chars = prevAndNextCharLines(line, script);
            const audio = await processCharacterLine(line, pn_chars.prev, pn_chars.next, current_character, runningTime);
            return createClip(audio, line);
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError;
}


async function processMusicLineWithRetry(
    line: MusicLine, 
    script: Script,
    maxRetries = 3
): Promise<Clip> {
    let lastError: Error;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const music_processed = await processMusicLine(line, script);
            return createClip(music_processed, line);
        } catch (error) {
            console.error(`Attempt ${i + 1} failed for music line ${line.order}:`, error);
            lastError = error;
        }
    }
    throw new Error(`Failed to process music line after ${maxRetries} attempts: ${lastError.message}`);
}