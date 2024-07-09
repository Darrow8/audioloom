import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

dotenv.config();

let voice = 'zcAOhNBS3c14rBihAFp1';
let model = 'eleven_multilingual_v2';

async function textToSpeech(text, prev_text, next_text){
    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: `{
                "text": "${text}",
                "model_id": "${model}",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.5,
                    "use_speaker_boost": true
                },
                "pronunciation_dictionary_locators": [
                ],
                "previous_text": "${prev_text}",
                "next_text": "${next_text}",
                "previous_request_ids": [
                ],
                "next_request_ids": [
                ]
                }`
     };
      
      await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, options)
        .then((response) => {
            let writer = Readable.fromWeb(response.body);
            
            writer.pipe(fs.createWriteStream('output.mp3'));
            
            writer.on('finish', () => {
              console.log(`Audio file saved to ${outputPath}`);
              return;
            });
        
            writer.on('error', (err) => {
              console.error('Error writing to file:', err);
            });
        })
        .catch(err => console.error(err));
}

