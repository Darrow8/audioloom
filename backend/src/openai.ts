import OpenAI, { toFile } from "openai";
import fs from "fs";
import path from "path";
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import * as aws from "./aws.js";

dotenv.config();


const openai = new OpenAI({
    organization: "org-nd9Kz3AFMD7Wo3q05FTQMFAw",
    project: "proj_6RLSgyTB2eo5NjAfghsFU8df",
    apiKey: process.env['OPENAI_API_KEY'],
});

/**
 * Uses OpenAI API to generate script for podcast
 * 
 */
export async function scriptwriter(article : string) {
  try{

    // const fileContents = fs.readFileSync("../test_result/article.txt").toString()
    const fileContents = await aws.getFileFromS3(`articles/${article}.txt`);
    const completion : any = await openai.chat.completions.create({
      messages: [{ role: "system", 
      content: 
      `
      You will receive a document that contains an informative article. 
      The document starts at "DOCUMENT_START" and ends at "DOCUMENT_END".
      Your job is to convert this article into a script for a podcast that contains all the information about the article. 
      Include sound effects and background music cues to make the podcast more entertaining, and add them like this "[Sound Effect/Background Music: Birds Chirping]".
      The podcast is called Podcast Pro and the host is Adam Page. When a new character is going to speak, the host should introduce them by their name and credentials.
      When a character has a speaking line, start with their name and then optionally add an adjective to describe their emotions "Speaker Name: [Inquisitive]".
      Each line in the script should have either a sound effect/background music or a person speaking.
      This podcast script should contain enough content to cover the information in the entire reading. 
      You may include external information for context if necessary.
      
      Here is a sample script:
      [Background Music: Noisy City Street]
      Adam Page: As of the latest estimates, New York City has a population of over 8 million people, making it the most populous city in the United States. Here is Anna Roberts, a writer at Podcast Pro, on cultural events in NYC. 
      Anna Roberts: [Excited] NYC hosts numerous events and festivals throughout the year, including the New Year's Eve Ball Drop in Times Square, the Macy's Thanksgiving Day Parade, and the Tribeca Film Festival.
      
      DOCUMENT_START
      ${fileContents}
      DOCUMENT_END
      ` }],
      model: "gpt-4o",
    })
    .catch(error => console.error(error));

    console.log(completion.choices[0]);
    
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

  // trimmer()
