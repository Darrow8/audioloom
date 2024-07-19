import * as openai from './openai.js';
import * as aws from './aws.js';
import * as eleven from './elevenlabs.js'
import * as aud from './audio_processer.js';
import fs from 'fs';
import path from 'path';
import { CharLine, MusicLine, MusicType, Script,  } from './pod_utils.js';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import * as epidemic from './epidemic.js';
import { Track, usefulTrack } from './epidemic_utils.js';

let script : Script = undefined;
/**
 * proccess_pod
 * Main function to process script
 */
async function proccess_pod(scriptName:string){
    script = await getScript(scriptName);

    // // // process char lines
    // let char_lines = script.getCharLines();
    // let char_audio = await processCharacterLines(char_lines);
    // try {
    //     let output = `${uuidv4()}.mp3`;
        
    //     await aud.spliceAudioFiles(char_audio,`${output}`, './result');
    //     console.log(`finished with ${output}`);
    //     // upload to S3
    //     const uploadDetails = {
    //         key: `pod-audio/${output}`,
    //         body: `./result/${output}`,
    //         ContentType: 'audio/mpeg'
    //     };
    //     await aws.uploadFileToS3(uploadDetails);
    //     // delete temp files
        // deleteAllFilesInFolder('./temp');
        // deleteAllFilesInFolder('./result');
    // } catch (err) {
    //     console.error('Error concatenating audio streams:', err);
    // }

    let output = "c4aa59a4-0b69-4bdc-8813-2a074d029d37.mp3";
    let music_lines = script.getMusicLines();
    let music_audio = await processMusicLines(music_lines);

}
/**
 * getScript
 * gets the script in Script() form and filters out unformatted data
 */
async function getScript(scriptName: string) : Promise<Script>{

    return await aws.getFileFromS3(`pod-scripts/${scriptName}.txt`)
    .then((result : string)=>{
        let raw_script = result.split('\n');
        let formatted_script = [];
        let lineCount = 1;
        for(let i = 0; i < raw_script.length; i++){
            let line = raw_script[i];
            line = line.trim();
            if(line == '' || line.length == 0){
            }else if(line.startsWith('[') && line.endsWith(']')){
                // music line
                formatted_script.push(new MusicLine(line, lineCount));
                lineCount++;
            }else{
                // character line
                formatted_script.push(new CharLine(line, lineCount));
                lineCount++;
            }
        }
        let script = new Script(formatted_script,"",[""]);
        return script;
    })
    .catch((err)=>{
        console.error(err);
        return null;
    })
}


/** 
 * processCharacterLines
 * process all Character Lines
 * lines -- array of CharLines
*/
async function processCharacterLines(lines: CharLine[]): Promise<string[]>{
    // get all unique characters
    let characterSet: Set<string> = new Set();
    lines.forEach(charLine => {
        characterSet.add(charLine.character);
    });
    let characterArr : string[] = Array.from(characterSet);
    // 
    let temp_saves = [];

    // loop through lines
    // lines.length
    // getting first 2 lines for now
    for(let i = 0; i < lines.length; i++){
        // get prev and next line
        let prev_line = null;
        let next_line = null;
        if(i > 0){
            prev_line = lines[i-1];
        }
        if(i < lines.length - 1){
            next_line = lines[i+1];
        }

        console.log(lines[i]);
        let audio = await processCharacterLine(lines[i], prev_line, next_line);
        let fileName = `${uuidv4()}.mp3`;
        console.log(fileName);
        await aud.saveStreamToFile(audio, `./temp/${fileName}`);
        console.log(await aud.getAudioDuration(`./temp/${fileName}`))
        temp_saves.push(`./temp/${fileName}`);
    }
    return temp_saves;
}

/** 
 * processCharacterLine
 * a character is going to speak in this line
*/
async function processCharacterLine(line:CharLine, prev_line: CharLine | null, next_line : CharLine | null) : Promise<Readable>{
    let prev_dialogue = "";
    let next_dialogue = "";
    let dialogue = line.dialogue;
    let character = line.character;
    if(prev_line != null && character == prev_line.character){
        prev_dialogue = prev_line.dialogue;
    }
    if(next_line != null && character == next_line.character){
        next_dialogue = next_line.dialogue;
    }
    let use_voice = "";
    let male_voice = "pNInz6obpgDQGcFmaJgB";
    let male_voice_2 = "VR6AewLTigWG4xSOukaG";
    let female_voice = "pNInz6obpgDQGcFmaJgB";
    let female_voice_2 = "LcfcDJNUP1GQjkzn1xUU";
    if(character == "Adam Page"){
        use_voice = male_voice;
    }else if(character == "Daria Korolenko"){
        use_voice = female_voice;
    }else if(character == "Lauren McCarthy"){
        use_voice = female_voice_2;
    }else if(character == "Dan Storyev"){
        use_voice = male_voice_2;
    }else{
        use_voice=male_voice;
    }

    dialogue = dialogue.trim();
    
    return await eleven.textToSpeech(use_voice,dialogue,prev_dialogue,next_dialogue);

}

async function processMusicLines(lines: MusicLine[]){
    let audio_arr : usefulTrack[] = [];
    for(let line of lines){
        let audio;
        if(line.type == MusicType.BMusic){
            audio = await processBMusicLine(line);
        }else if(line.type == MusicType.SFX){
            audio = await processSFXMusicLine(line)

        }else{
            throw `error, found line with bad type: ${line}`;
        }
        audio_arr.push(audio);
    }
    console.log(audio_arr);
}


/**
 * processMusicLine
 * An audio clip is going to play during this line
 */
async function processBMusicLine(music_line:MusicLine) : Promise<usefulTrack>{
    let line_order = music_line.order;
    let dialogue_desc = "";
    if(line_order < script.lines.length){
        dialogue_desc = script.lines[line_order].raw_string;
    }
    // console.log(`dialogue_desc: ${dialogue_desc}`);
    let res = await openai.musicChooser(music_line.music_description, dialogue_desc)
    let music_choice = {};
    try {
        music_choice = JSON.parse(res);
    } catch (e) {
        throw `error parsing music chooser result ${res}`;
    }
    if('genre' in music_choice == false){
        music_choice['genre'] = "";
    }
    if('mood' in music_choice == false){
        music_choice['mood'] = "";
    }
    let tracks : usefulTrack[] = await epidemic.fetchTracks(music_choice['genre'],music_choice['mood'])
    let track = tracks[0];
    if(tracks.length == 0){
        return undefined;
    }
    let new_id = uuidv4();
    track.id = new_id;
    let outputPath = `./music/${track.id}.mp3`; // Replace with your desired local output file name
    let url = track.stems.full.lqMp3Url
    await epidemic.downloadFile(url, outputPath).catch((err) => {
        console.error(err);
    });
    return track;
}

/**
 * processMusicLine
 * An audio clip is going to play during this line
 */
async function processSFXMusicLine(music_line:MusicLine) : Promise<usefulTrack>{
    let tracks : usefulTrack[] = await epidemic.fetchSFX(music_line.music_description)
    let track = tracks[0];
    if(tracks.length == 0){
        return undefined;
    }
    let new_id = uuidv4();
    track.id = new_id;
    let outputPath = `./music/${track.id}.mp3`; // Replace with your desired local output file name
    let url = track.stems.full.lqMp3Url
    await epidemic.downloadFile(url, outputPath).catch((err) => {
        console.error(err);
    });
    return track;
}


function deleteAllFilesInFolder(folderPath) {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error(`Unable to scan directory: ${err}`);
        return;
      }
  
      files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file ${filePath}: ${err}`);
          } else {
          }
        });
      });
      console.log(`Deleted files in ${folderPath}`);
    });
  }


proccess_pod("russia_script3");
