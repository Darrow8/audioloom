import { uploadFileToS3, getFileFromS3, uploadAudioToS3} from './pass_files.js';
import * as aud from './process_audio.js';
import { CharLine, Clip, MusicLine, Script, createClips } from './util_pod.js';
import { v4 as uuidv4 } from 'uuid';
import { temp_char, temp_music, temp_result_file } from './temp.js';
import { processCharacterLines, processMusicLines } from './process_line.js';
import { deleteAllFilesInFolder, saveAsJson } from './local.js';

export let script: Script | null = null;
export let run_temp = true;

/**
 * proccess_pod
 * Main function to process script
 */
export async function createPodcast(scriptName: string) {
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

        await uploadAudioToS3(resultFileName);
        // deleteTempFiles()
    } catch (err) {
        console.error('Error in process_pod:', err);
        throw err;
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
    await aud.spliceAudioFiles(char_processed, `${resultFileName}.mp3`, '/tmp/character');
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


/**
 * Delete temp files that are used in processing
 */
function deleteTempFiles() {
    deleteAllFilesInFolder('/tmp/dialogue');
    deleteAllFilesInFolder('/tmp/character');
    deleteAllFilesInFolder('/tmp/character-temp');
    deleteAllFilesInFolder('/tmp/music');
    deleteAllFilesInFolder('/tmp/music-temp');
    deleteAllFilesInFolder('/tmp/result');
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

