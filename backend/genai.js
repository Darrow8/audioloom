import OpenAI, { toFile } from "openai";
import fs from "fs";
import path from "path";
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();


const openai = new OpenAI({
    organization: "org-nd9Kz3AFMD7Wo3q05FTQMFAw",
    project: "proj_6RLSgyTB2eo5NjAfghsFU8df",
    apiKey: process.env['OPENAI_API_KEY'],
});

// const filePath = path.join(__dirname, '../test_result/article.txt');


async function scriptwriter() {
  const fileContents = fs.readFileSync("../test_result/article.txt").toString()
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", 
    content: 
    `
    You will receive a document that contains an informative article. 
    The document starts at "DOCUMENT_START" and ends at "DOCUMENT_END".
    Your job is to convert this article into a script for a podcast that contains all the important information about the article. 
    This podcast script should contain enough content for a 30 minute episode. 
    You may include external information for context if necessary.
    DOCUMENT_START
    ${fileContents}
    DOCUMENT_END
    ` }],
    model: "gpt-4-turbo",
  });

  console.log(completion.choices[0].message.content);
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
