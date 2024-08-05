import OpenAI, { toFile } from "openai";
import fs from "fs";
import path from "path";
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import * as aws from "./aws.js";
import { get_encoding, encoding_for_model, TiktokenModel } from "tiktoken";
dotenv.config();


const openai = new OpenAI({
    organization: process.env['OPENAI_ORG_KEY'],
    project: process.env['OPENAI_PROJECT_KEY'],
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
      Adam Page: As of the latest estimates, New York City has a population of over 8 million people, making it the most populous city in the United States. Here is Anna Roberts, a writer for the New York Times, on cultural events in NYC. 
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
    
    await aws.uploadFileToS3(uploadDetails)
      .then(response => {
        console.log(response)
      })
      .catch(error => console.error(error));
  }catch(error){
    console.log(error)
  }
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

  
    // console.log(completion.choices[0]);
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