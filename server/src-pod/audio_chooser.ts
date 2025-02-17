import OpenAI from "openai";
import { openaiClient } from "@pod/init.js";
import { genres, moods } from "@shared/music.js";


export async function musicChooser(music_description: string, next_dialogue: string): Promise<{ genre?: string, mood?: string, duration?: number }> {
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
            genres = [${genres}]
            Also choose a duration for how long the music should play in seconds, recommended between 10 and 60 seconds. 
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
    model: "gpt-4",
    tools: [{
      type: "function",
      function: {
        name: "set_music",
        parameters: {
          type: "object",
          properties: {
            genre: { type: "string", enum: genres },
            mood: { type: "string", enum: moods },
            duration: {type: "number"}
          },
          required: ["genre", "mood", "duration"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "set_music" } }
  });
  const functionCall = completion.choices[0].message.tool_calls?.[0];
  if (functionCall?.function) {
    console.log(`musicChooser: functionCall: ${functionCall.function.arguments}`);
    const result = JSON.parse(functionCall.function.arguments);
    
    // Ensure all required fields are present with default values if needed
    return {
      genre: result.genre,
      mood: result.mood,
      duration: result.duration
    };
  }
  
  // Return default values if no function call result
  return {
  };
}

export interface Music_Choice {
  genre: string,
  mood: string
}


export async function themeChooser(pod_description: string): Promise<Music_Choice> {
  console.log(`themeChooser: music_description: ${pod_description}`);
  const completion = await openaiClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
            Your job is to choose a background music mood and genre for a podcast. 
            You will be given a description for the podcast and dialogue that will be spoken while the music is playing.
            You can choose 0 or 1 genres and 0 or 1 moods for the music choice among the following: 
            moods = [${moods}]
            genres = [${genres}]`
      },
      {
        role: 'user',
        content: `
            Podcast description: ${pod_description}
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
    // console.log(`musicChooser: functionCall: ${functionCall.function.arguments}`);
    return JSON.parse(functionCall.function.arguments) as Music_Choice;
  }
  
  return {
    genre: "",
    mood: ""
  };
}
