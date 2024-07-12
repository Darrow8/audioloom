import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import axios from 'axios';
import { ElevenLabsClient } from "elevenlabs";


dotenv.config();

let model = 'eleven_multilingual_v2';

export async function textToSpeech(voice : string, text : string, prev_text : string, next_text : string) : Promise<Readable>{
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

  const client = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
  });
  
    // const createAudioFileFromText = async (
    //   text: string
    // ): Promise<string> => {
      return new Promise<Readable>(async (resolve, reject) => {
          await client.generate({
            voice: voice,
            model_id: model,
            text: text,
            previous_text: prev_text != "" ? prev_text : null,
            next_text: next_text != "" ? next_text : null,
          }).then((audio)=>{
            resolve(audio);

          }).catch((err)=>{
            console.error(err);
            reject();
          })
      });
}

