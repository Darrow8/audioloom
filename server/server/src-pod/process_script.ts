import fs from "fs";
import * as aws from "./pass_files.js";
import { encoding_for_model, TiktokenModel } from "tiktoken";
import { openaiClient } from "./init.js";
import { ChatModel } from "openai/resources/index.js";
import { buildIntructions } from "./util_script.js";

/**
 * Start with reading that has been uploaded earlier, ends with script in S3
*/
export async function createScript(readingFileName : string){
  let readingContent = await aws.getFileFromS3(`readings/${readingFileName}`);
  let fileType = readingFileName.split('.')[1]; 
  if(fileType == "txt"){
    // good!
  } else if (fileType == "pdf"){
    // convert to txt
    
  }else {
    // figure out what else we can do

  }
  
  
  let article = cleanReading();  
  // upload article

  let articleName = "";
  let articleContent = await aws.getFileFromS3(`articles/${articleName}.txt`);
  await articleToScript(articleName,articleContent);
}

/**
 * remove unnecessary things in article and trim whitespace
 */ 
async function cleanReading(){
  // manually clean reading through basic methods

}

async function articleToScript(articleName: string, articleContent: string) {
  // get article from S3

  // get instructions which incorporate articleContent
  let instructions = buildIntructions(articleContent);
  const screenwriterModel: { version: ChatModel, tokenLimit: number } =
    { version: 'gpt-4o', tokenLimit: 128000 };

  let intructionsTokens = countTokens(instructions, screenwriterModel.version);

  if (intructionsTokens > screenwriterModel.tokenLimit) {
    // Article + intructions has exceeded token limit, must split into batches
    // TODO: write code for batch splitting
  } else {
    await scriptwriter(articleName, instructions, screenwriterModel);
  }

}


/**
 * Uses OpenAI API to generate script for podcast
 */
export async function scriptwriter(articleName:string, instructions: string, model: { version: ChatModel, tokenLimit: number }) {
  try {

    const completion: any = await openaiClient.chat.completions.create({
      messages: [{
        role: "system",
        content: instructions
      }],
      model: model.version,
    })
      .catch(error => console.error(error));

    const uploadDetails = {
      key: `pod-scripts/${articleName}_script.txt`,
      body: completion.choices[0].message.content,
      contentType: 'text/plain'
    };

    await aws.uploadFileToS3(uploadDetails)
      .then(response => {
        console.log(response)
      })
      .catch(error => console.error(error));
  } catch (error) {
    console.log(error)
  }
}


async function trimmer() {
  const fileContents = fs.readFileSync("../test_result/article.txt").toString()
  const completion = await openaiClient.chat.completions.create({
    messages: [
      {
        role: "system",
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
}

/**
 * Counts the number of tokens in a message based on the AI model
 */
function countTokens(message: string, model: ChatModel): number {
  const enc = encoding_for_model(model as TiktokenModel);
  const tokens = enc.encode(message);
  enc.free();
  return tokens.length;
}