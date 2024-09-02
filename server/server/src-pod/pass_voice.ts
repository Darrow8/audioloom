import { Readable } from 'stream';
import { Character, masculine_voices, feminine_voices } from "./util_voice";
import { elevenlabsClient, openaiClient } from './init';



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
    let char = new Character(char_name, "", "");
    if (char_name == "Adam Page") {
      char.voice_model = "iP95p4xoKVk53GoZ742B"; // Adam Page voice
    } else {
      let guess_gender = await determineFemMasc(char_name);
      if (guess_gender == 'masculine') {
        char.voice_model = getRandomElement(masculine_voices);
      } else if (guess_gender == 'feminine') {
        char.voice_model = getRandomElement(feminine_voices);

      } else {
        console.error('No voice recieved!')
        // just do all random for now
        char.voice_model = getRandomElement([...masculine_voices, ...feminine_voices])
      }

    }
    char_arr.push(char);
  }

  return char_arr;
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