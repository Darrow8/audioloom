import { uploadFileToS3, getFileFromS3, uploadAudioToS3 } from './pass_files.js';
import { CharLine, Clip, MusicLine, Script, createClips, Line, AudioFile, createClip } from './util_pod.js';
import { v4 as uuidv4 } from 'uuid';
import { getTempChar, getTempMusic, temp_result_file } from './temp.js';
import { processCharacterLines, processMusicLines, processMusicLine, processCharacterLine, prevAndNextCharLines } from './process_line.js';
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
import fsPromises from 'fs/promises';
import { ProcessingStatus, ProcessingStep } from './util_processing.js';

/**
 * proccess_pod
 * Main function to process script
 */
export async function createPodcast(scriptName: string) {
    return new Promise(async (resolve, reject) => {
        try {
            let script_data = await getScript(scriptName,scriptName,false);
            let script = script_data.script;
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
export async function createPodInParallel(script_path: string, res: Response) {
    const tempFiles: string[] = [];
    try {
        // Validate script path
        if (!script_path || !script_path.endsWith('.txt')) {
            return {
                status: ProcessingStatus.ERROR,
                step: "podcast",
                message: "Invalid script path. Must be a .txt file"
            } as ProcessingStep;
        }

        const script_data = await getScript(script_path, script_path, true);
        if (script_data.status === ProcessingStatus.ERROR || !script_data.script) {
            return {
                status: ProcessingStatus.ERROR,
                step: "podcast",
                message: script_data.message
            } as ProcessingStep;
        }

        const script = script_data.script;
        const resultFileName = `${uuidv4()}`;
        
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
                if (clip) {
                    cur_clips.push(clip);
                    tempFiles.push(clip.audio.url);
                }

                if (shouldMergeClips(cur_clips)) {
                    runningTime = await mergeAndCleanup(cur_clips, resultFileName, runningTime, script, res);
                    cur_clips = [];
                }
            } catch (error) {
                console.error(`Error processing line ${i}:`, error);
                throw new Error(`Failed to process line ${i}: ${error.message}`);
            }
        }

        // Final merge if there are remaining clips
        if (cur_clips.length > 0) {
            runningTime = await mergeAndCleanup(cur_clips, resultFileName, runningTime, script, res);
        }

        return {
            status: ProcessingStatus.SUCCESS,
            step: "podcast",
            duration: runningTime,
            filename: `${resultFileName}.wav`
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

async function processLine(
    line: Line, 
    script: Script, 
    characters: Character[], 
    runningTime: number
): Promise<Clip | null> {
    if ((line as CharLine).dialogue?.length > 0) {
        return await processCharacterLineWithRetry(line as CharLine, script, characters, runningTime);
    } else if ('type' in line) {
        return await processMusicLineWithRetry(line as MusicLine, script);
    }
    return null;
}

async function processCharacterLineWithRetry(
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
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    throw lastError;
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
 * convert char line into char clip 
 */
async function getCharClip(line: CharLine, script: Script, characters: Character[], runningStartTime: number): Promise<Clip> {
    if (process.env.RUN_TEMP == "true") {
        let clips: Clip[] = getTempChar();
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
async function getMusicClip(line: MusicLine, script: Script): Promise<Clip> {
    if (process.env.RUN_TEMP == "true") {
        let clips: Clip[] = getTempMusic();
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
async function getScript(scriptName: string, localPath: string, isLocal: boolean=true): Promise<{status: string, message: string, script: Script | null}> {
    let prim_script = '';
    if (isLocal) {
        prim_script = await fsPromises.readFile(localPath, 'utf-8');
    } else {
        prim_script = await getFileFromS3(`pod-scripts/${scriptName}.txt`)
    }

    if(prim_script == ''){
        return {
            status: "error",
            message: "Script is empty",
            script: null
        };
    }
    let raw_script = prim_script.split('\n');
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
    return {
        status: "success",
        message: "",
        script: script
    };
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
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
    throw new Error(`Failed to process music line after ${maxRetries} attempts: ${lastError.message}`);
}