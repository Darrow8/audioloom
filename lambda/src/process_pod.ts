import * as openai from './process_script.js';
import * as aws from './aws.js';
// import * as eleven from './process_voice.js'
import { textToSpeech, processCharacterVoices } from './process_voice.js';
import * as aud from './process_audio.js';
import fs from 'fs';
import path from 'path';
import { AudioFile, CharLine, Clip, MusicLine, MusicType, Script, createClips } from './utils_pod.js';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import * as epidemic from './epidemic.js';
import { Track, usefulTrack } from './utils_sound.js';
import { saveMusicAsAudio } from './utils_track.js';
import { temp_char, temp_music, saveAsJson, temp_result_file } from './temp_data.js';
import { musicChooser } from './process_track.js';

let script: Script | null = null;
let run_temp = true;

/**
 * proccess_pod
 * Main function to process script
 */
async function proccess_pod(scriptName: string) {
    try {
        script = await getScript(scriptName);
        // final result file name
        
        let resultFileName = `${uuidv4()}`;
        if(run_temp){
            resultFileName = temp_result_file;
        }
        let char_clips : Clip[] = await getCharClips(resultFileName);
        let music_clips : Clip[] = await getMusicClips();
        // combine clips and save in ./result
        await aud.addInMusic(resultFileName, char_clips, music_clips, resultFileName);

        // await uploadToS3(resultFileName);
        // deleteTempFiles()
    } catch (err) {
        console.error('Error in process_pod:', err);
    }
}

async function getCharClips(resultFileName: string) : Promise<Clip[]> {
    if(run_temp){
        // await saveAsJson(temp_char, "./logs",`char-${uuidv4()}`)
        return temp_char;
    }
    // process char lines
    let char_lines = script.getCharLines();
    let char_processed = await processCharacterLines(char_lines);
    await aud.spliceAudioFiles(char_processed, `${resultFileName}.mp3`, './content/character');
    let char_clips: Clip[] = createClips(char_processed, char_lines);
    await saveAsJson(char_clips, "./logs",`char-${uuidv4()}`)
    return char_clips;
}

async function getMusicClips() : Promise<Clip[]> {
    if(run_temp){
        // await saveAsJson(temp_music, "./logs", `music-${uuidv4()}`)
        return temp_music;
    }
    // process music lines
    let music_lines = script.getMusicLines();
    let music_processed = await processMusicLines(music_lines);
    let music_clips: Clip[] = createClips(music_processed, music_lines);
    await saveAsJson(music_clips, "./logs",`music-${uuidv4()}`)
    return music_clips;
}

async function uploadToS3(resultFileName: string){
    let resultFilePath = `./content/result/${resultFileName}.mp3`;
    // upload to S3
    const uploadDetails = {
        key: `pod-audio/${resultFileName}.mp3`,
        body: resultFilePath,
        ContentType: 'audio/mpeg'
    };
    await aws.uploadFileToS3(uploadDetails);
}

/**
 * Delete temp files that are used in processing
 */
function deleteTempFiles() {
    deleteAllFilesInFolder('./content/dialogue');
    deleteAllFilesInFolder('./content/character');
    deleteAllFilesInFolder('./content/character-temp');
    deleteAllFilesInFolder('./content/music');
    deleteAllFilesInFolder('./content/music-temp');
    deleteAllFilesInFolder('./content/result');
}


/**
 * getScript
 * gets the script in Script() form and filters out unformatted data
 */
async function getScript(scriptName: string): Promise<Script> {

    return await aws.getFileFromS3(`pod-scripts/${scriptName}.txt`)
        .then((result: string) => {
            let raw_script = result.split('\n');
            let formatted_script = [];
            let lineCount = 1;
            for (let i = 0; i < raw_script.length; i++) {
                let line = raw_script[i];
                line = line.trim();
                if (line == '' || line.length == 0) {
                } else if (line.startsWith('[') && line.endsWith(']')) {
                    // music line
                    formatted_script.push(new MusicLine(line, lineCount, uuidv4()));
                    lineCount++;
                } else {
                    // character line
                    formatted_script.push(new CharLine(line, lineCount, uuidv4()));
                    lineCount++;
                }
            }
            let script = new Script(formatted_script, "", [""]);
            return script;
        })
        .catch((err) => {
            console.error(err);
            return null;
        })
}


/** 
 * processCharacterLines
 * process all Character Lines
 * lines -- array of CharLines
*/
async function processCharacterLines(lines: CharLine[]): Promise<AudioFile[]> {
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
        let url = `./content/dialogue/${fileName}`;
        await aud.saveStreamToFile(stream, url);
        await aud.getAudioDuration(url).catch(err => console.error(err))
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
async function processCharacterLine(line: CharLine, prev_line: CharLine | null, next_line: CharLine | null, voice_model: string): Promise<Readable> {
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

async function processMusicLines(lines: MusicLine[]): Promise<AudioFile[]> {
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
async function processBMusicLine(music_line: MusicLine): Promise<AudioFile> {
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
    let tracks: usefulTrack[] = await epidemic.fetchTracks(music_choice['genre'], music_choice['mood']);

    return await saveMusicAsAudio(tracks, music_line.id);
}

/**
 * processMusicLine
 * An audio clip is going to play during this line
 */
async function processSFXMusicLine(music_line: MusicLine): Promise<AudioFile> {
    let tracks: usefulTrack[] = await epidemic.fetchSFX(music_line.music_description);
    return await saveMusicAsAudio(tracks, music_line.id);
}


function deleteAllFilesInFolder(folderPath) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(`Unable to scan directory: ${err}`);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(folderPath, file);

            // Check if the file is read-only and change permissions if necessary
            fs.chmod(filePath, 0o666, (chmodErr) => {
                if (chmodErr) {
                    console.error(`Error changing permissions for file ${filePath}: ${chmodErr}`);
                    return;
                }

                // Delete the file
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Error deleting file ${filePath}: ${unlinkErr}`);
                    } else {
                        console.log(`Successfully deleted file ${filePath}`);
                    }
                });
            });
        });

        // console.log(`Deleted files in ${folderPath}`);
    });
}

proccess_pod("russia_script3")