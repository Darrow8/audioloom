import OpenAI from "openai";
import { openaiClient } from "./init";
import { genres, moods } from "@shared/music";


export async function musicChooser(music_description: string, next_dialogue: string): Promise<{ genre?: string, mood?: string }> {
  console.log(`musicChooser: music_description: ${music_description}`);
  const completion = await openaiClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
            Your job is to choose background music for a podcast. 
            You will be given a description for background music and dialogue that will be spoken while the music is playing.
            You can choose 0 or 1 genres and 0 or 1 moods for the music choice among the following: 
            moods = [${moods}]
            genres = [${genres}]`
      },
      {
        role: 'user',
        content: `
            Music description: ${music_description}
            Next line of dialogue: ${next_dialogue}
            `,

      }
    ],
    model: "gpt-4",
    tools: [{
      type: "function",
      function: {
        name: "set_music",
        parameters: {
          type: "object",
          properties: {
            genre: { type: "string", enum: genres },
            mood: { type: "string", enum: moods }
          },
          required: []
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "set_music" } }
  });
  const functionCall = completion.choices[0].message.tool_calls?.[0];
  if (functionCall?.function) {
    console.log(`musicChooser: functionCall: ${functionCall.function.arguments}`);
    return JSON.parse(functionCall.function.arguments);
  }
  
  return {};
}

