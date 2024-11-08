import fs from "fs";
import * as aws from "./pass_files.js";
import { encoding_for_model, TiktokenModel } from "tiktoken";
import { openaiClient } from "./init.js";
import { buildIntructions, GPTModel, InstructionType } from "./util_script.js";
import { ChatModel } from "openai/resources/index.js";
import { ProcessingStatus, ProcessingStep } from "./util_processing.js";

/**
 * Start with reading that has been uploaded earlier, ends with script in S3
*/
export async function createScript(local_file_path: string): Promise<ProcessingStep> {
  try {
    // Validate file extension
    if (!local_file_path.match(/\.(txt)$/i)) {
      return {
        status: ProcessingStatus.ERROR,
        step: "script",
        message: "Unsupported file format"
      } as ProcessingStep;
    }

    let articleContent = fs.readFileSync(local_file_path, 'utf8');
    if (!articleContent) {
      return {
        status: ProcessingStatus.ERROR,
        step: "script",
        message: "File is empty"
      } as ProcessingStep;
    }

    try {
      let cleaner_response = await promptCleaner(local_file_path, articleContent);
      console.log(`Successfully cleaned file to ${cleaner_response}`);

      if (cleaner_response.status === ProcessingStatus.IN_PROGRESS) {
        let cleanArticle = fs.readFileSync(cleaner_response.message, 'utf8');
        let scriptwriter_response = await promptScriptwriter(local_file_path, cleanArticle);
        
        // Cleanup temporary cleaned file
        fs.unlinkSync(cleaner_response.message);
        
        return scriptwriter_response as ProcessingStep;
      }
      return cleaner_response as ProcessingStep;

    } catch (error) {
      // Cleanup any temporary files that might have been created
      const cleanedPath = `${local_file_path}_cleaned.txt`;
      if (fs.existsSync(cleanedPath)) {
        fs.unlinkSync(cleanedPath);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in createScript:', error);
    return {
      status: ProcessingStatus.ERROR,
      step: "script",
      message: error.message || "Error processing script"
    } as ProcessingStep;
  }
}

/**
 * remove unnecessary things in article and trim whitespace
 */ 
async function promptCleaner(local_file_path:string, articleContent:string): Promise<ProcessingStep>{
  // manually clean reading through basic methods
  let instructions = buildIntructions(articleContent, InstructionType.CLEAN);
  const cleanerModel: GPTModel = { version: 'gpt-4o', tokenLimit: 128000 };

  let intructionsTokens = countTokens(instructions, cleanerModel.version);
  if (intructionsTokens > cleanerModel.tokenLimit) {
    // Article + intructions has exceeded token limit, must split into batches
    return {
      status: ProcessingStatus.ERROR,
      step: "cleaner",
      message: "Article + intructions has exceeded token limit, must split into batches"
    } as ProcessingStep;
  } else {
    let clean_file_path = await cleaner(local_file_path, articleContent, instructions, cleanerModel);
    return {
      status: ProcessingStatus.IN_PROGRESS,
      step: "cleaner",
      message: clean_file_path
    } as ProcessingStep;
  }
}

async function promptScriptwriter(articleName: string, articleContent: string): Promise<ProcessingStep>{
  // get instructions which incorporate articleContent
  let instructions = buildIntructions(articleContent, InstructionType.PODCAST);
  const screenwriterModel: GPTModel = { version: 'gpt-4o', tokenLimit: 128000 };

  let intructionsTokens = countTokens(instructions, screenwriterModel.version);

  if (intructionsTokens > screenwriterModel.tokenLimit) {
    // Article + intructions has exceeded token limit, must split into batches
    return {
      status: ProcessingStatus.ERROR,
      step: "scriptwriter",
      message: "Article + intructions has exceeded token limit, must split into batches"
    } as ProcessingStep;
  } else {
    let scriptwriter_response = await scriptwriter(articleName, instructions, screenwriterModel);
    if(typeof scriptwriter_response == "string"){
      return {
        status: ProcessingStatus.IN_PROGRESS,
        step: "scriptwriter",
        message: scriptwriter_response
      } as ProcessingStep;
    }else{
      return scriptwriter_response as ProcessingStep;
    }
  }

}


/**
 * Uses OpenAI API to generate script for podcast
 */
export async function scriptwriter(articleName:string, instructions: string, model: GPTModel) {
  try {

    const completion: any = await openaiClient.chat.completions.create({
      messages: [{
        role: "system",
        content: instructions
      }],
      model: model.version,
      max_tokens: model.tokenLimit,
    })
    let result = completion.choices[0].message.content;

    // save to file
    let new_name = `${articleName}_script.txt`;
    fs.writeFileSync(new_name, result);
    return new_name;
  } catch (error) {
    return {
      status: ProcessingStatus.ERROR,
      step: "scriptwriter",
      message: "Error generating script in scriptwriter"
    } as ProcessingStep;
  }
}

/**
 * Uses OpenAI API to clean article
 */
async function cleaner(articleName: string, articleContent: string, instructions: string, model: GPTModel) {
  const completion = await openaiClient.chat.completions.create({
    messages: [{
      role: "system",
      content: instructions
    },
      {
        role: 'user',
        content: `Please process this:
            DOCUMENT_START
            ${articleContent}
            DOCUMENT_END
            `,

      }
    ],
    model: model.version,
    max_tokens: model.tokenLimit,
  });
  let result = completion.choices[0].message.content;

  // save to file
  let new_name = `${articleName}_cleaned.txt`;
  fs.writeFileSync(new_name, result);
  return new_name;
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

export async function saveScriptToS3(script_path: string){
    const uploadDetails = {
      Key: `pod-scripts/${script_path}`,
      Body: fs.readFileSync(script_path),
      ContentType: 'text/plain',
      Bucket: 'main-server',
    };

    await aws.uploadFileToS3(uploadDetails)
      .then(response => {
        console.log(response)
      })
      .catch(error => console.error(error));
    fs.unlinkSync(script_path);
}
