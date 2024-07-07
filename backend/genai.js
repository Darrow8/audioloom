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

// const filePath = path.join(__dirname, '../test_result/article.txt');


async function scriptwriter() {
  try{
    const fileContents = fs.readFileSync("../test_result/article.txt").toString()
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", 
      content: 
      `
      You will receive a document that contains an informative article. 
      The document starts at "DOCUMENT_START" and ends at "DOCUMENT_END".
      Your job is to convert this article into a script for a podcast that contains all the information about the article. 
      Include sound effects and background music cues to make the podcast more entertaining, and add them like this: [Sound Effect].
      The podcast is called "podcast pro" and the host is "Adam Page". When introducing new people, start with their name and credentials. 
      This podcast script should contain enough content for a 30 minute episode. 
      You may include external information for context if necessary.
      DOCUMENT_START
      ${fileContents}
      DOCUMENT_END
      ` }],
      model: "gpt-4-turbo",
    })
    .catch(error => console.error(error));

    console.log(completion.choices[0]);
    
    const uploadDetails = {
      key: 'articles/test2.txt',
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

scriptwriter()

// async function trimmer() {
//     const fileContents = fs.readFileSync("../test_result/article.txt").toString()
//     const completion = await openai.chat.completions.create({
//       messages: [
//         {   role: "system", 
//             content: `
//             You will receive a document that may be poorly formatted. 
//             Your job is to trim the document just include the information of the article. Delete unecessary newlines.
//             `
//         },
//         {
//             role: 'user',
//             content: `Please process this:
//             DOCUMENT_START
//             ${fileContents}
//             DOCUMENT_END
//             `,

//           } 
//     ],
//       model: "gpt-4-turbo",
//     });

  
//     console.log(completion.choices[0]);
//   }
  // trimmer()
