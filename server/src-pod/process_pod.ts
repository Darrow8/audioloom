import { uploadFileToS3, getFileFromS3, uploadAudioToS3 } from './pass_files.js';
import { CharLine, Clip, MusicLine, Script, createClips, Line, AudioFile, createClip } from './util_pod.js';
import { v4 as uuidv4 } from 'uuid';
import { getTempChar, getTempMusic, temp_result_file } from './temp.js';
import { processCharacterLines, processMusicLines,processMusicLine, processCharacterLine, prevAndNextCharLines } from './process_line.js';
import { deleteAllFilesInFolder, saveAsJson } from './local.js';
import { TEMP_DATA_PATH } from './init.js';
import { addInMusic, checkStartTime, spliceAudioFiles } from './process_audio.js';
import { processCharacterVoices } from './pass_voice.js';
import { Character } from './util_voice.js';
import { parallelMerge } from './process_merging.js';
import path from 'path';
import fs from 'fs';
import { saveClipToLogs } from './local.js'; // Add this import at the top of the file
import { Request, Response, Express } from 'express';

/**
 * proccess_pod
 * Main function to process script
 */
export async function createPodcast(scriptName: string) {
    return new Promise(async (resolve, reject) => {
        try {
            let script = await getScript(scriptName);

            // final result file name
            let resultFileName = `${uuidv4()}`;
            if (process.env.RUN_TEMP == "true") {
                resultFileName = temp_result_file;
            }
            let char_clips: Clip[] = await getCharClips(resultFileName, script);
            let music_clips: Clip[] = await getMusicClips(script);
            // combine clips and save in ./result
            await addInMusic(resultFileName, char_clips, music_clips, resultFileName);

            await uploadAudioToS3(resultFileName);
            // deleteTempFiles()
            resolve(resultFileName);
        } catch (err) {
            console.error('Error in process_pod:', err);
            reject(err);
        }
    });
}

/**
 * createPodcastInParallel
 * In each iteration, process a character line and music line to update audio file
 */
export async function createPodcastInParallel(scriptName: string, res: Response) {
    let script = await getScript(scriptName);
    let resultFileName = `${uuidv4()}`;
    let characters_str = new Set(script.getCharLines().map(line => line.character));
    let characters : Character[] = await processCharacterVoices(Array.from(characters_str));
    // keeps track of what time the current line should start at
    let runningTime = 0;
    // current clips to be merged
    let cur_clips: Clip[] = [];
    let music_filelog : string = `music-${uuidv4()}`;
    let char_filelog : string = `char-${uuidv4()}`;
    // loop through each line to create char audio and music audio, then merge together every 2 lines
    for(let i = 0; i < script.lines.length; i++){
        let line = script.lines[i];
        let clip: Clip = undefined;
        if((line as CharLine).dialogue?.length > 0){
            // this is a character line
            clip = await getCharClip(line as CharLine, script, characters, runningTime);
            await saveClipToLogs(clip, `${TEMP_DATA_PATH}/logs`, char_filelog)
        }else if('type' in line){
            // this is a music line
            clip = await getMusicClip(line as MusicLine, script);
            await saveClipToLogs(clip, `${TEMP_DATA_PATH}/logs`, music_filelog)
        } else{
            console.error('Unknown line type');
        }
        if(clip != undefined){
            cur_clips.push(clip);
        }
        // if last clip is dialogue, then merge
        if (cur_clips.length > 0 && 
            'dialogue' in cur_clips[cur_clips.length - 1].line &&
            (cur_clips[cur_clips.length - 1].line as CharLine).dialogue?.length > 0) {
            // merge the audio
            runningTime = await parallelMerge(runningTime, cur_clips, resultFileName, script);
            // Check if the resultFileName file exists
            const resultFilePath = path.join(TEMP_DATA_PATH, 'result', `${resultFileName}.wav`);
            if (!fs.existsSync(resultFilePath)) {
                console.error(`Result file not found: ${resultFilePath}`);
                throw new Error(`Result file not found: ${resultFilePath}`);
            }
            // save to aws s3
            let result = await uploadAudioToS3(`${resultFileName}.wav`);
            if(result){
                console.log('saved to s3');
                res.write(JSON.stringify({
                    "status":"in progress",
                    "duration": runningTime,
                    "filename": `${resultFileName}.wav`
                }));
            }
            cur_clips = [];
        }
    }
    console.log("done")
    res.status(200).send(JSON.stringify({
        "status":"done",
        "filename": `${resultFileName}.wav`
    }));
}


/**
 * convert char line into char clip 
 */
async function getCharClip(line: CharLine, script: Script, characters: Character[], runningStartTime: number): Promise<Clip>{
    if(process.env.RUN_TEMP == "true"){
        let clips : Clip[] = getTempChar();
        let clip = clips.find((clip) => clip.line.order == line.order);
        return clip;
    }
    let pn_chars = prevAndNextCharLines(line, script);
    let current_character = characters.find((char) => char.name == line.character);
    let audio = await processCharacterLine(line, pn_chars.prev, pn_chars.next, current_character, runningStartTime);
    let clip = createClip(audio, line);
    return clip;
}

/**
 * get music clip 
 */
async function getMusicClip(line: MusicLine, script: Script): Promise<Clip>{
    if(process.env.RUN_TEMP == "true"){
        let clips : Clip[] = getTempMusic();
        let clip = clips.find((clip) => clip.line.order == line.order);
        return clip;
    }
    let music_processed = await processMusicLine(line, script);
    let music_clip = createClip(music_processed, line);
    return music_clip;
}


async function getCharClips(resultFileName: string, script: Script): Promise<Clip[]> {
    if (process.env.RUN_TEMP == "true") {
        let char_processed = getTempChar().map(char => char.audio);
        char_processed = checkStartTime(char_processed);
        await spliceAudioFiles(char_processed, `${resultFileName}.mp3`, `${TEMP_DATA_PATH}/character`);
        // incorporate char_processed into temp_char
        let temp_char = getTempChar();
        for (let i = 0; i < temp_char.length; i++) {
            temp_char[i].audio.start = char_processed[i].start;
            temp_char[i].audio.duration = char_processed[i].duration;
        }
        return temp_char;
    }
    // process char lines
    let char_lines = script.getCharLines();
    let char_processed = await processCharacterLines(char_lines);
    await spliceAudioFiles(char_processed, `${resultFileName}.mp3`, `${TEMP_DATA_PATH}/character`);
    char_processed = checkStartTime(char_processed);
    let char_clips: Clip[] = createClips(char_processed, char_lines);
    await saveAsJson(char_clips, `${TEMP_DATA_PATH}/logs`, `char-${uuidv4()}`)
    return char_clips;
}

async function getMusicClips(script: Script): Promise<Clip[]> {
    if (process.env.RUN_TEMP == "true") {
        // await saveAsJson(temp_music, "./logs", `music-${uuidv4()}`)
        return getTempMusic();
    }
    // process music lines
    let music_lines = script.getMusicLines();
    let music_processed = await processMusicLines(music_lines, script);
    let music_clips: Clip[] = createClips(music_processed, music_lines);
    await saveAsJson(music_clips, `${TEMP_DATA_PATH}/logs`, `music-${uuidv4()}`)
    return music_clips;
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

/**
 * getScript
 * gets the script in Script() form and filters out unformatted data
 */
async function getScript(scriptName: string): Promise<Script> {

    return await getFileFromS3(`pod-scripts/${scriptName}.txt`)
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

