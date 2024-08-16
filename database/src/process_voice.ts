import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import axios from 'axios';
import { ElevenLabsClient } from "elevenlabs";
import { determineFemMasc } from './process_track';
import {Character} from "./utils_pod";


dotenv.config();

let model = 'eleven_multilingual_v2';

export async function textToSpeech(voice : string, text : string, prev_text : string, next_text : string, emotion: string) : Promise<Readable>{
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

  const client = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
  });
  
    // const createAudioFileFromText = async (
    //   text: string
    // ): Promise<string> => {

    let formatted_text;
    if(emotion == ""){
      formatted_text = text;
    }else{
      formatted_text = `<${emotion}>: ${text}`
    }
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

let masculine_voices = [
  "pqHfZKP75CvOlQylNhV4",
  "nPczCjzI2devNBz1zQrb",
  "IKne3meq5aSn9XLyUdCD",
  "cjVigY5qzO86Huf0OWal",
  "TX3LPaxmHKxFdv7VOQHJ",
  "876MHA6EtWKaHTEGzjy5",
  "C8ZGTRs8koIlo6hG4dtq",
  "TWUKKXAylkYxxlPe4gx0",
  "876MHA6EtWKaHTEGzjy5",
  "4TqSkQOuasn8QDvHi3jF",
  "LlZr3QuzbW4WrPjgATHG",
  "uju3wxzG5OhpWcoi3SMy",
  "pVnrL6sighQX7hVz89cp"
]

let feminine_voices = [
  "wVZ5qbJFYF3snuC65nb4",
  "6vTyAgAT8PncODBcLjRf",
  "P7x743VjyZEOihNNygQ9",
  "MnUw1cSnpiLoLhpd3Hqp",
  "OYTbf65OHHFELVut7v2H",
  "0lyV68Aacjmcsjj9LO1q",
  "prXE2qOa3nbiL3y1Qhu3",
  "pBZVCk298iJlHAcHQwLr",
  "0F2wDqEyuZzoQIxmFSNU",
  "21m00Tcm4TlvDq8ikWAM",
  "oWAxZDx7w5VEj9dCyTzz"
]

export async function processCharacterVoices(characters: string[]) : Promise<Character[]>{
  let char_arr : Character[] = [];

  for(let char_name of characters){
    let char = new Character(char_name,"","");
    if(char_name == "Adam Page"){
      char.voice_model = "iP95p4xoKVk53GoZ742B"; // Adam Page voice
    }else{
      let guess_gender = await determineFemMasc(char_name);
      if(guess_gender == 'masculine'){
        char.voice_model = getRandomElement(masculine_voices);
      }else if(guess_gender == 'feminine'){
        char.voice_model = getRandomElement(feminine_voices);

      }else{
        console.error('No voice recieved!')
        // just do all random for now
        char.voice_model = getRandomElement([...masculine_voices, ...feminine_voices])
      }

    }
    char_arr.push(char);
  }
  
  return char_arr;
}

function getRandomElement(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}