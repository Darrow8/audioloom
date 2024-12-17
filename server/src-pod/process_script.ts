import fs from "fs";
import * as aws from "@pod/pass_files.js";
import { encoding_for_model, TiktokenModel } from "tiktoken";
import { ChatModel } from "openai/resources/index";
import { ProcessingStatus, ProcessingStep } from "@shared/processing.js";
import { promptLLM, localInstructions } from "@pod/process_prompt.js";
import { FullLLMPrompt, FullPrompts, PromptLLM, RawPrompts, ScriptType } from "@shared/script.js";
import { Pod } from "@shared/pods.js";
import { createMongoData } from "@db/mongo_methods.js";
import { updateMongoArrayDoc } from "@db/mongo_methods.js";
import { ObjectId } from "mongodb";
import { base_instructions } from "@pod/pod_main.js";
import { Script } from "@shared/script.js";
import crypto from "crypto";
import { saveScriptToLogs } from "@pod/local.js";
import path from "path";
import { deleteTempFiles } from "@pod/process_pod.js";

// step 1: get instructions
export async function getInstructions(articleContent: string): Promise<FullPrompts>{
  let fullInstructions: FullPrompts = {} as FullPrompts;
  for(let key of Object.keys(base_instructions)){

    let prompt = base_instructions[key] as PromptLLM;
    fullInstructions[key] = {
      response_type: prompt.response_type,
      GPTModel: prompt.GPTModel,
      type: prompt.type
    } as FullLLMPrompt;
    if (key === 'podcast') {
      // Get word count to help ensure podcast length
      const wordCount = articleContent.trim().split(/\s+/).length;
      let minCount = Math.ceil(wordCount / 150);
      // Add word count context to help GPT generate appropriate length podcast
      let additionalInstructions = `\nThe article is ${wordCount} words long. Please ensure the podcast script has enough content and discussion to fill at least ${minCount} minutes.`;
      console.log(additionalInstructions)
      fullInstructions[key].instructions = prompt.raw_instructions + additionalInstructions + '\nDOCUMENT_START\n' + articleContent + '\nDOCUMENT_END';
    } else {
      fullInstructions[key].instructions = prompt.raw_instructions + '\nDOCUMENT_START\n' + articleContent + '\nDOCUMENT_END';
    }
  }
  return fullInstructions;
}

// step 2: clean article
export async function cleanArticle(articleName:string, instructions: FullLLMPrompt): Promise<ProcessingStep>{
  let clean_file_path = await promptLLM(articleName, instructions);
  return clean_file_path as ProcessingStep;
}

// step 3: get title
export async function getTitle(articleName:string, instructions: FullLLMPrompt): Promise<ProcessingStep>{
  let title = await promptLLM(articleName, instructions);
  return title as ProcessingStep;
}
// step 4: get author
export async function getAuthor(articleName:string, instructions: FullLLMPrompt): Promise<ProcessingStep>{
  let author = await promptLLM(articleName, instructions);
  return author as ProcessingStep;
}
//step 5: create script
export async function scriptwriter(articleName: string, instructions: FullLLMPrompt): Promise<ProcessingStep>{
  let response = await promptLLM(articleName, instructions);
  if (response.status != ProcessingStatus.ERROR) {
    let script = response.data.script as ScriptType;
    // Ensure required properties are present before creating Script
    const validatedLines = script.lines.map(line => ({
      ...line,
      id: line.id || crypto.randomUUID(),
      raw_string: line.raw_string,
      order: line.order,
      kind: line.kind 
    }));
    const newScript = new Script(validatedLines, script.title, script.authors);
    saveScriptToLogs(newScript, './logs', crypto.randomUUID().toString());
    return {
      status: ProcessingStatus.IN_PROGRESS,
      step: "script",
      message: "Script created",
      script: newScript
    } as ProcessingStep;
  }
  return response;
}

// /**
//  * Start with reading that has been uploaded earlier, ends with script in S3
// */
export async function createScript(local_file_path: string, newPod: Partial<Pod>, user_id: ObjectId): Promise<ProcessingStep> {
  try {
    // Validate file extension
    if (!local_file_path.match(/\.(txt)$/i)) {
      return {
        status: ProcessingStatus.ERROR,
        step: "script",
        message: "Unsupported file format"
      };
    }

    let articleContent = fs.readFileSync(local_file_path, 'utf8');
    if (!articleContent) {
      return {
        status: ProcessingStatus.ERROR,
        step: "script",
        message: "File is empty"
      };
    }

    let instructions = await getInstructions(articleContent);
    // Process each step and check for errors
    const cleanStep = await cleanArticle(local_file_path, instructions.clean);
    if (cleanStep.status === ProcessingStatus.ERROR) return cleanStep;
    console.log(cleanStep)
    const titleStep = await getTitle(local_file_path, instructions.title);
    if (titleStep.status === ProcessingStatus.ERROR) return titleStep;
    console.log(titleStep)
    const authorStep = await getAuthor(local_file_path, instructions.author);
    if (authorStep.status === ProcessingStatus.ERROR) return authorStep;
    console.log(authorStep)

    const scriptStep = await scriptwriter(local_file_path, instructions.podcast);
    if (scriptStep.status === ProcessingStatus.ERROR) return scriptStep;
    console.log(scriptStep)
    // Safely update pod with new data
    try {
      newPod.author = authorStep.data.author || "Unknown Author";
      newPod.title = titleStep.data.title || "Untitled";
      newPod.created_at = new Date();
      console.log(newPod)
      await createMongoData('pods', newPod);
      await updateMongoArrayDoc('users', user_id, 'pods', newPod._id);
      deleteTempFiles()
    } catch (dbError) {
      return {
        status: ProcessingStatus.ERROR,
        step: "script",
        message: "Failed to update database: " + dbError.message
      };
    }
    return scriptStep;
  } catch (error) {
    return {
      status: ProcessingStatus.ERROR,
      step: "script",
      message: error.message || "Error processing script"
    };
  }
}

/**
 * Counts the number of tokens in a message based on the AI model
 */
export function countTokens(message: string, model: ChatModel): number {
  console.log('countTokens', model)
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

export async function saveFileToS3(file_path: string){
  const fileName = path.basename(file_path);

  const uploadDetails = {
    Key: `pod-scripts/${fileName}`,
    Body: fs.readFileSync(file_path),
    ContentType: 'text/plain',
    Bucket: 'main-server',
  };

  await aws.uploadFileToS3(uploadDetails)
    .then(response => {
      console.log(response)
    })
    .catch(error => console.error(error));
  fs.unlinkSync(file_path);
}
