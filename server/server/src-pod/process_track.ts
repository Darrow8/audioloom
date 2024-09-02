import OpenAI from "openai";
import { openaiClient } from "./init";
import { genres, moods } from "./util_music";


export async function musicChooser(music_description: string, next_dialogue: string): Promise<string> {

  const completion = await openaiClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
            Your job is to choose background music for a podcast. 
            You will be given a description for background music and dialogue that will be spoken while the music is playing.
            You can choose 0 or 1 genres and 0 or 1 moods for the music choice among the following: 
            moods = [${moods}]
            genres = [${genres}]
            Please return your choice in the following JSON form:
            {
            "genre" : "western",
            "mood" : "happy"
            } 
            `
      },
      {
        role: 'user',
        content: `
            Music description: ${music_description}
            Next line of dialogue: ${next_dialogue}
            `,

      }
    ],
    model: "gpt-4o-mini",
  });
  // TODO: write error handling code in case we get a bad response

  return completion.choices[0].message.content as string;
}

