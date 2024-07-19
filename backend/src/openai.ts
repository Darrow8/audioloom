import OpenAI, { toFile } from "openai";
import fs from "fs";
import path from "path";
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import * as aws from "./aws.js";
import { get_encoding, encoding_for_model, TiktokenModel } from "tiktoken";
dotenv.config();


const openai = new OpenAI({
    organization: "org-nd9Kz3AFMD7Wo3q05FTQMFAw",
    project: "proj_6RLSgyTB2eo5NjAfghsFU8df",
    apiKey: process.env['OPENAI_API_KEY'],
});

// https://platform.openai.com/docs/models/gpt-4o
const gptModel = "gpt-4o";
const tokenLimit = 128000;

/**
 * Uses OpenAI API to generate script for podcast
 * 
 */
export async function scriptwriter(article : string) {
  try{
    const fileContents = await aws.getFileFromS3(`articles/${article}.txt`);
    
    let instructions =  `
      You will receive a document that contains an informative article. 
      The document starts at "DOCUMENT_START" and ends at "DOCUMENT_END".
      Your job is to convert this article into a script for a podcast that contains all the information about the article. 
      Include sound effects and background music cues to make the podcast more entertaining, and add them like this "[Sound Effect: Birds Chirping]".
      When including background music, be sure to be detailed in your request, for example: "[Background Music: earthy tones, environmentally conscious, ukulele-infused, harmonic, breezy, easygoing, organic instrumentation, gentle grooves]".
      The podcast is called Rivet Audio and the host is Adam Page. When a new character is going to speak, the host should introduce them by their name and credentials.
      When a character has a speaking line, start with their name and then optionally add an adjective to describe their emotions "Speaker Name: [Inquisitive]".
      Each line in the script should have either a sound effect/background music or a person speaking.
      This podcast script should contain enough content to cover the information in the entire reading. 
      You may include external information for context if necessary.
      Here is a sample script:
      [Sound Effect: Noisy City Street]
      Adam Page: As of the latest estimates, New York City has a population of over 8 million people, making it the most populous city in the United States. Here is Anna Roberts, a writer at Rivet Audio, on cultural events in NYC. 
      Anna Roberts: [Excited] NYC hosts numerous events and festivals throughout the year, including the New Year's Eve Ball Drop in Times Square, the Macy's Thanksgiving Day Parade, and the Tribeca Film Festival.
      DOCUMENT_START
      ${fileContents}
      DOCUMENT_END
      ` 

    let tokenCount = countTokens(instructions,gptModel);

    if(tokenCount > tokenLimit){
      throw `token limit exceeded, token count: ${tokenCount}, token limit: ${tokenLimit}`;
    }

    const completion : any = await openai.chat.completions.create({
      messages: [{ role: "system", 
      content: 
      instructions
      }],
      model: gptModel,
    })
    .catch(error => console.error(error));

    const uploadDetails = {
      key: `pod-scripts/${article}_script.txt`,
      body: completion.choices[0].message.content,
      contentType: 'text/plain'
    };
    
    aws.uploadFileToS3(uploadDetails)
      .then(response => console.log(response))
      .catch(error => console.error(error));
  }catch(error){
    console.log(error)
  }
}


export async function musicChooser(music_description : string, next_dialogue: string) : Promise<string>{
  const completion = await openai.chat.completions.create({
    messages: [
      {   role: "system", 
          content: `
          Your job is to choose background music for a podcast. 
          You will be given a description for background music and dialogue that will be spoken while the music is playing.
          You can choose 0 or 1 genres and 0 or 1 moods for the music choice among the following: 
          moods = [
            "angry", "busy & frantic", "changing tempo", "chasing", "dark", "dreamy", 
            "eccentric", "elegant", "epic", "euphoric", "fear", "floating", "funny", 
            "glamorous", "happy", "heavy & ponderous", "hopeful", "laid back", "marching", 
            "mysterious", "peaceful", "quirky", "relaxing", "restless", "romantic", 
            "running", "sad", "scary", "sentimental", "sexy", "smooth", "sneaking", 
            "suspense", "weird"
          ]
          genres = [
            "abstract hip hop", "acoustic", "solo guitar", "solo piano", "ambient", "asmr", 
            "binaural beats", "drone", "new age", "ambient americana", "ambient dub", 
            "ambient pop", "ballad", "batida", "beats", "bloopers", "blues", "acoustic blues", 
            "african blues", "blues rock", "classic blues", "country blues", "delta blues", 
            "modern blues", "brass & marching band", "bagpipes", "military & historical", 
            "oompah", "breakbeat", "2-step", "big beat", "drum and bass", "dubstep", 
            "future garage", "jungle", "liquid funk", "techstep", "uk garage", "cartoons", 
            "children's music", "lullabies", "cinematic", "action", "adventure", "beautiful", 
            "build", "chase", "crime scene", "drama", "horror", "main title", "mystery", 
            "nostalgia", "pulses", "strange & weird", "supernatural", "suspense", "tragedy", 
            "circus & funfair", "amusement park", "classical", "choral", "classical crossover", 
            "contemporary classical", "indian classical", "orchestral", "orchestral hybrid", 
            "small ensemble", "solo instrumental", "string ensemble", "waltz", "classical period", 
            "comedy", "comedy rock", "conscious hip hop", "corporate", "country", "americana", 
            "bluegrass", "contemporary country", "country pop", "country rock", "traditional country", 
            "western", "cumbia pop", "dance", "dark ambient", "decade", "1950s", "1960s", 
            "1970s", "1980s", "1990s", "2000s", "2010s", "2020s", "disco", "boogie", "nu disco", 
            "downtempo", "balearic beat", "chillout", "chillstep", "chillwave", "trip hop", 
            "easy listening", "lounge", "electro-funk", "electronic", "bit music", "dark wave", 
            "edm", "electro", "electro swing", "eurodance", "footwork", "future bass", "hardstyle", 
            "idm", "indietronica", "jersey club", "melodic techno", "midtempo bass", "minimal techno", 
            "psytrance", "synthwave", "techno", "trance", "trap edm", "vaporwave", "electronica", 
            "euro-trance", "experimental electronic", "experimental hip hop", "fanfares", 
            "ceremonial & olympic", "filmi", "folk", "alternative folk", "celtic", 
            "contemporary folk", "folk pop", "indie folk", "klezmer", "polka", "funk", 
            "afro-funk", "funk rock", "synth funk", "hard trap", "hip hop", "alternative hip hop", 
            "boom bap", "bounce", "detroit trap", "drift phonk", "drill", "east coast hip hop", 
            "grime", "lo-fi hip hop", "old school hip hop", "trap", "west coast hip hop", 
            "hip hop soul", "horror synth", "house", "afro house", "amapiano", "ambient house", 
            "bass house", "big room house", "deep house", "electro house", "future funk", 
            "future house", "lo-fi house", "microhouse", "organic house", "outsider house", 
            "progressive house", "slap house", "tech house", "tribal house", "tropical house", 
            "huapango", "indian pop", "indie surf", "industrial metal", "j-pop", "j-rock", 
            "jazz", "acid jazz", "bebop", "big band", "classic jazz", "contemporary jazz", 
            "cool jazz", "dark jazz", "jazz fusion", "jazz-funk", "latin jazz", "ragtime", 
            "smooth jazz", "swing", "korean classical", "latin", "bolero", "bossa nova", 
            "calypso", "chachachá", "corrido tumbado", "cumbia", "flamenco", "funk carioca", 
            "guaracha edm", "latin pop", "mambo", "mariachi", "reggaeton", "rumba", "salsa", 
            "samba", "tango", "marching band", "metal", "heavy metal", "thrash metal", 
            "metalcore", "neoclassical dark wave", "norteño", "nu metal", "phonk", "pop", 
            "afrobeats", "alternative pop", "bedroom pop", "contemporary christian", 
            "dance-pop", "dream pop", "electropop", "europop", "hyperpop", "indie pop", 
            "k-pop", "pop rock", "schlager", "synth-pop", "teen pop", "pop soul", 
            "post-classical", "praise & worship", "psychedelic soul", "punk", "pop punk", 
            "punk rock", "r&b", "contemporary r&b", "motown", "ranchera", "reggae", "dub", 
            "ska", "regional mexicano", "religious music", "sneaky", "rock", "alternative rock", 
            "arena rock", "electronic rock", "folk rock", "garage rock", "grunge", "hard rock", 
            "indie rock", "post-rock", "psychedelic rock", "rock and roll", "rockabilly", 
            "roots rock", "soft rock", "surf rock", "romantic classical", "sambass", "screamo", 
            "singer-songwriter", "smooth soul", "son jarocho", "soul", "gospel", "neo soul", 
            "soul blues", "southern hip hop", "special occasions", "birthdays", "christmas", 
            "drinking songs", "funerals", "weddings", "speed house", "symphonic poem", 
            "uk drill", "vaudeville", "world & countries", "african continent", "cuba", 
            "greece", "india", "ireland", "japan", "korea", "mexico", "middle east", 
            "scandinavian", "the balkans", "usa", "world fusion"
          ]
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
  return completion.choices[0].message.content as string;
}


async function trimmer() {
    const fileContents = fs.readFileSync("../test_result/article.txt").toString()
    const completion = await openai.chat.completions.create({
      messages: [
        {   role: "system", 
            content: `
            You will receive a document that may be poorly formatted. 
            Your job is to remove any table of contents, graphs, images, citations, or other information that does not relate to the content of the article. 
            Remove unecessary blank lines as well.
            DO NOT remove any content from the document, only the things listed above. 
            `
        },
        {
            role: 'user',
            content: `Please process this:
            DOCUMENT_START
            ${fileContents}
            DOCUMENT_END
            `,

          } 
    ],
      model: "gpt-4-turbo",
    });

  
    console.log(completion.choices[0]);
  }
/**
 * Counts the number of tokens in a message based on the AI model
 */
function countTokens(message : string, model : TiktokenModel) : number{
  const enc = encoding_for_model(model);
  const tokens = enc.encode("hello world");
  enc.free();
  return tokens.length;
}