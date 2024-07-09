import * as openai from './openai.js';
import * as aws from './aws.js';
import fs from 'fs';
import { CharLine, MusicLine, Script,  } from './pod.js';


/**
 * proccess_pod
 * Main function to process script
 */
async function proccess_pod(scriptName){
    await aws.getFileFromS3(`pod-scripts/${scriptName}.txt`)
    .then((result)=>{
        let raw_script = result.split('\n');
        let formatted_script = [];
        for(let i = 0; i < raw_script.length; i++){
            let line = raw_script[i];
            line = line.trim();
            if(line == '' || line.length == 0){
            }else if(line.startsWith('[') && line.endsWith(']')){
                // music line
                formatted_script.push(new MusicLine(line, i));
            }else{
                // character line
                formatted_script.push(new CharLine(line, i));
            }
        }
        console.log(formatted_script);
        let script = new Script(formatted_script,"","");
        return script;
    })
    .catch((err)=>{
        console.error(err);
    })
}

/** 
 * characterLine
 * a character is going to speak in this line
*/
async function characterLine(i, script){

}
/**
 * musicLine
 * An audio clip is going to play during this line
 */
async function musicLine(line){

}


proccess_pod("russia_script3");