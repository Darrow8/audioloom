import { Readable } from 'stream';
import { Character, Voices } from "@shared/voice.js";
import { elevenlabsClient, openaiClient } from '@pod/init.js';
import { RawPrompts } from '@shared/script.js';
import fs from 'fs';
import { base_voices } from '@pod/pod_main.js';


export async function getVoices() {
  const rawData = fs.readFileSync('prompts/model_voices.json', 'utf8');
  return JSON.parse(rawData) as Voices;
}

export async function textToSpeech(voice: string, text: string, prev_text: string, next_text: string, emotion: string): Promise<Readable> {
  let model = 'eleven_multilingual_v2';
  let formatted_text;
  if (emotion == "") {
    formatted_text = text;
  } else {
    formatted_text = `<${emotion}>: ${text}`
  }
  return new Promise<Readable>(async (resolve, reject) => {
    await elevenlabsClient.generate({
      voice: voice,
      model_id: model,
      text: text,
      previous_text: prev_text != "" ? prev_text : undefined,
      next_text: next_text != "" ? next_text : undefined,
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.4,
        style: 0.15,
        use_speaker_boost: true,
      }
    }).then((audio) => {
      resolve(audio);
    }).catch((err) => {
      console.error(err);
      reject();
    })
  });
}

export async function processCharacterVoices(characters: string[]): Promise<Character[]> {
  let char_arr: Character[] = [];

  for (let char_name of characters) {
    let char = await processCharacterVoice(char_name);
    char_arr.push(char);
  }

  return char_arr;
}

export async function processCharacterVoice(char_name: string): Promise<Character> {
  let char = new Character(char_name, "", "");
  if (char_name == "Adam Page") {
    char.voice_model = base_voices.host_voice; // Adam Page voice
  } else {
    let guess_gender = await determineFemMasc(char_name);
    if (guess_gender == 'masculine') {
      char.voice_model = getRandomElement(base_voices.masculine_voices);
    } else if (guess_gender == 'feminine') {
      char.voice_model = getRandomElement(base_voices.feminine_voices);

    } else {
      console.error('No voice recieved!')
      // just do all random for now
      char.voice_model = getRandomElement([...base_voices.masculine_voices, ...base_voices.feminine_voices])
    }

  }
  return char;
}

function getRandomElement(arr: any[]) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

/**
 * Determine whether a character is feminine or masculine by their name
 */
export async function determineFemMasc(name: string): Promise<string> {

  const completion = await openaiClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
              Make an educated guess as to whether a name is feminine or masculine.
              Return either "feminine" or "masculine" only
              `
      },
      {
        role: 'user',
        content: `
              name: ${name}
              `,

      }
    ],
    model: "gpt-4o-mini",
  });
  return (completion.choices[0].message.content as string).trim();
}