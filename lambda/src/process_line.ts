import { AudioFile, CharLine, MusicLine, MusicType } from './util_pod.js';
import { textToSpeech, processCharacterVoices } from './pass_voice.js';
import { musicChooser } from './process_track.js';
import { getAudioDuration } from './process_audio.js';
import { script } from './process_pod.js';
import { usefulTrack  } from './util_music.js';
import { saveMusicAsAudio } from './util_track.js';
import { fetchTracks, fetchEpidemicSFX } from './pass_music.js';
import { Readable } from 'stream';
import { saveStreamToFile } from './local.js';
import { TEMP_DATA_PATH } from './init.js';

/** 
 * processCharacterLines
 * process all Character Lines
 * lines -- array of CharLines
*/
export async function processCharacterLines(lines: CharLine[]): Promise<AudioFile[]> {
    // get all unique characters
    let characterSet: Set<string> = new Set();
    lines.forEach(charLine => {
        characterSet.add(charLine.character);
    });
    let characterArr: string[] = Array.from(characterSet);

    let characters = await processCharacterVoices(characterArr);
    console.log(characters);
    let temp_saves: AudioFile[] = [];


    // getting first 2 lines for now
    for (let i = 0; i < lines.length; i++) {
        // get prev and next line
        let prev_line = null;
        let next_line = null;
        if (i > 0) {
            prev_line = lines[i - 1];
        }
        if (i < lines.length - 1) {
            next_line = lines[i + 1];
        }
        // get current character
        let current_character = characters.find((char) => char.name == lines[i].character);
        if (current_character == null || current_character == undefined) {
            console.error('no character found!');
        }

        let stream = await processCharacterLine(lines[i], prev_line, next_line, current_character.voice_model);
        let fileName = `${lines[i].id}.mp3`;
        let url = `${TEMP_DATA_PATH}/dialogue/${fileName}`;
        await saveStreamToFile(stream, url);
        await getAudioDuration(url).catch(err => console.error(err))
            .then((duration: number) => {
                let audio = new AudioFile(lines[i].id, url, duration, -1);
                temp_saves.push(audio);
            })
    }
    return temp_saves;
}

/** 
 * processCharacterLine
 * a character is going to speak in this line
*/
export async function processCharacterLine(line: CharLine, prev_line: CharLine | null, next_line: CharLine | null, voice_model: string): Promise<Readable> {
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

export async function processMusicLines(lines: MusicLine[]): Promise<AudioFile[]> {
    let audio_arr: AudioFile[] = [];
    for (let line of lines) {
        let audio: AudioFile | null = null;
        if (line.type == MusicType.BMusic) {
            audio = await processBMusicLine(line);
        } else if (line.type == MusicType.SFX) {
            audio = await processSFXMusicLine(line)

        } else {
            throw `error, found line with bad type: ${line}`;
        }
        if (audio != null) {
            audio_arr.push(audio);
        }
    }
    // console.log(audio_arr);
    return audio_arr;
}


/**
 * processMusicLine
 * An audio clip is going to play during this line
 */
export async function processBMusicLine(music_line: MusicLine): Promise<AudioFile> {
    let line_order = music_line.order;
    let dialogue_desc = "";
    if (line_order < script.lines.length) {
        dialogue_desc = script.lines[line_order].raw_string;
    }
    // console.log(`dialogue_desc: ${dialogue_desc}`);
    let res = await musicChooser(music_line.music_description, dialogue_desc)
    let music_choice: { genre?: string, mood?: string } = {};
    try {
        music_choice = JSON.parse(res);
    } catch (e) {
        console.log(`error parsing music chooser result ${res}`)
        // throw `error parsing music chooser result ${res}`;
    }
    if ('genre' in music_choice == false) {
        music_choice.genre = "";
    }
    if ('mood' in music_choice == false) {
        music_choice.mood = "";
    }
    let tracks: usefulTrack[] = await fetchTracks(music_choice['genre'], music_choice['mood']);

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
