import fs from "fs";
import * as aws from "@pod/pass_files.js";
import { encoding_for_model, Tiktoken, TiktokenModel } from "tiktoken";
import { ChatModel } from "openai/resources/index";
import { ProcessingStatus, ProcessingStep } from "@shared/processing.js";
import { promptLLM } from "@pod/process_prompt.js";
import { BaseScriptType, FullLLMPrompt, FullPrompts, PromptLLM, RawPrompts } from "@shared/script.js";
import { Pod } from "@shared/pods.js";
import { createMongoData } from "@db/mongo_methods.js";
import { updateMongoArrayDoc } from "@db/mongo_methods.js";
import { ObjectId } from "mongodb";
import { base_instructions } from "@pod/pod_main.js";
import { Script } from "@shared/script.js";
import crypto from "crypto";
import { saveScript } from "@pod/local.js";
import path from "path";
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_PATH } from "@pod/init.js";
import { InstructionType } from "@shared/script.js";
import { cleanText, cleanTextFile } from "@pod/cleaner.js";
import { readFile, writeFile } from "fs/promises";

// // step 1: get instructions
export async function getCleanInstructions(articleContent): Promise<FullLLMPrompt> {
  let init = base_instructions["clean"] as PromptLLM;
  let resp = {
    response_type: init.response_type,
    GPTModel: init.GPTModel,
    type: init.type
  } as FullLLMPrompt;
  resp.instructions = init.raw_instructions + '\nDOCUMENT_START\n' + articleContent + '\nDOCUMENT_END';
  return resp
}

export async function getInstructions(articleContent: string): Promise<FullPrompts> {
  let fullInstructions: FullPrompts = {} as FullPrompts;
  for (let key of Object.keys(base_instructions)) {
    let prompt = base_instructions[key] as PromptLLM;
    fullInstructions[key] = {
      response_type: prompt.response_type,
      GPTModel: prompt.GPTModel,
      type: prompt.type
    } as FullLLMPrompt;
    if (prompt.type === 'podcast') {
      // add additional instructions
      let wpm = 150;
      const wordCount = articleContent.trim().split(/\s+/).length;
      let minCount = Math.ceil(wordCount / wpm);
      // Add word count context to help GPT generate appropriate length podcast
      let additionalInstructions = `\nThe article is ${wordCount} words long. Please ensure the podcast script has enough content and discussion to fill at least ${minCount} minutes considering the average talking speed of ${wpm} words per minute.`;
      fullInstructions[key].instructions = prompt.raw_instructions + additionalInstructions + '\nDOCUMENT_START\n' + articleContent + '\nDOCUMENT_END';
    } else {
      fullInstructions[key].instructions = prompt.raw_instructions + '\nDOCUMENT_START\n' + articleContent + '\nDOCUMENT_END';
    }
  }
  return fullInstructions;
}

// step 2: clean article
export async function cleanArticle(articleName: string, instructions: FullLLMPrompt): Promise<ProcessingStep> {
  let clean_file_path = await promptLLM(articleName, instructions, InstructionType.CLEAN);
  return clean_file_path as ProcessingStep;
}

// step 3: get title
export async function getTitle(articleName: string, instructions: FullLLMPrompt): Promise<ProcessingStep> {
  let title = await promptLLM(articleName, instructions, InstructionType.TITLE);
  return title as ProcessingStep;
}
// step 4: get author
export async function getAuthor(articleName: string, instructions: FullLLMPrompt): Promise<ProcessingStep> {
  let author = await promptLLM(articleName, instructions, InstructionType.AUTHOR);
  return author as ProcessingStep;
}
//step 5: create script
export async function scriptwriter(articleName: string, instructions: FullLLMPrompt): Promise<ProcessingStep> {
  let response = await promptLLM(articleName, instructions, InstructionType.PODCAST);
  if (response.status != ProcessingStatus.ERROR) {
    let baseScript = response.data as BaseScriptType;
    // Ensure required properties are present before creating Script
    const validatedLines = baseScript.lines.map((line, index) => ({
      ...line,
      id: uuidv4().toString(),
      order: (index + 1),
      kind: line.kind
    }));
    return {
      status: ProcessingStatus.IN_PROGRESS,
      step: "script",
      message: "Script created",
      script: validatedLines
    } as ProcessingStep;
  }
  return response;
}

// /**
//  * Start with reading that has been uploaded earlier, ends with script in S3
//*/
export async function createScript(local_file_path: string, articleId: string, newPod: Partial<Pod>, user_id: ObjectId, mode: "prod" | "dev"): Promise<ProcessingStep> {
  try {
    // Validate file extension
    if (!local_file_path.match(/\.(txt)$/i)) {
      return {
        status: ProcessingStatus.ERROR,
        step: "script",
        message: "Unsupported file format"
      };
    }

    let articleContent: string;
    // attempt to clean article
    let clean_text = await cleanTextFile(local_file_path);
    if (clean_text != "" && clean_text.length > 1000) {
      console.log('using cleaned article version')
      articleContent = clean_text;
    } else {
      console.log('using original article version')
      articleContent = await readFile(local_file_path, 'utf8');
      if (!articleContent) {
        return {
          status: ProcessingStatus.ERROR,
          step: "script",
          message: "File is empty"
        };
      }
    }

    await writeFile(`${STORAGE_PATH}/clean-${articleId}.txt`, articleContent);
    let instructions = await getInstructions(articleContent);
    // Process each step and check for errors
    const titleStep = await getTitle(local_file_path, instructions.title);
    if (titleStep.status === ProcessingStatus.ERROR) return titleStep;
    let title = titleStep.data.title || "Untitled";
    console.log(titleStep)
    const authorStep = await getAuthor(local_file_path, instructions.author);
    if (authorStep.status === ProcessingStatus.ERROR) return authorStep;
    let author = authorStep.data.author || "Unknown Author";
    console.log(authorStep)
    console.log(instructions.podcast)
    const scriptStep = await scriptwriter(local_file_path, instructions.podcast);
    if (scriptStep.status === ProcessingStatus.ERROR) return scriptStep;
    let script_file_path = `${uuidv4().toString()}.json`;
    const newScript = new Script(scriptStep.script, title, [author], script_file_path);
    await saveScript(newScript, script_file_path);
    newPod.author = author;
    newPod.title = title;
    newPod.created_at = new Date();
    await createMongoData('pods', newPod, mode);
    await updateMongoArrayDoc('users', user_id, 'pods', newPod._id, mode);
    return {
      status: ProcessingStatus.IN_PROGRESS,
      step: "script",
      message: "Script created",
      script: newScript
    } as ProcessingStep;
  } catch (dbError) {
    return {
      status: ProcessingStatus.ERROR,
      step: "script",
      message: "Failed to update database: " + dbError.message
    };
  }
}

/**
 * Counts the number of tokens in a message based on the AI model
 */
export function countTokens(message: string, model: ChatModel, type: InstructionType): number {
  const enc = encoding_for_model(model as TiktokenModel);
  const tokens = enc.encode(message);
  enc.free();
  console.log('countTokens', model, "num tokens", tokens.length, "type", type)
  return tokens.length;
}

/**
 * Gets the first n tokens from a string using the specified GPT encoding
 * @param text The input text to tokenize
 * @param n The number of tokens to return
 * @param model Optional GPT model name to determine encoding (defaults to 'gpt-4')
 * @returns The text corresponding to the first n tokens
 */
export async function getFirstNTokens(
  text: string, 
  n: number, 
  model: TiktokenModel = "gpt-4o"
): Promise<string> {
  // Get the appropriate encoding for the model
  const encoding = encoding_for_model(model);

  // Encode the full text to tokens
  const tokens = encoding.encode(text);

  // Take first n tokens
  const truncatedTokens = tokens.slice(0, n);

  // Decode back to text
  const result = encoding.decode(truncatedTokens);

  // Free up memory
  encoding.free();

  return result.toString();
}

