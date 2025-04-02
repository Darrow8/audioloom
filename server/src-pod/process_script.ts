import fs from "fs";
import * as aws from "@pod/s3_files.js";
import { encoding_for_model, Tiktoken, TiktokenModel } from "tiktoken";
import { ChatModel } from "openai/resources/index";
import { ProcessingStatus, ProcessingStep } from "@shared/processing.js";
import { getMetadata } from "@pod/process_prompt.js";
import { ArticleMetadata, BaseScriptType, PromptLLM, RawPrompts } from "@shared/script.js";
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
import { promptLLMChunks } from "@pod/process_prompt.js";
import { Music_Choice } from "@pod/audio_chooser.js";
import { humanizer } from "@pod/humanize.js";





// /**
//  * Start with reading that has been uploaded earlier, ends with script in S3
//*/
export async function createScript(local_file_path: string, articleId: string, newPod: Partial<Pod>, user_id: ObjectId, mode: "prod" | "dev"): Promise<ProcessingStep> {
	try {
		// Validate file extension
		if (!local_file_path.match(/\.(txt)$/i)) {
			throw new Error("Unsupported file format");
		}

		let articleContent: string;
		// attempt to clean article
		let clean_text = await cleanTextFile(local_file_path);
		if (clean_text != "" && clean_text.length > 1000) {
			console.log('using cleaned article version')
			articleContent = clean_text;
			if (process.env.VERBOSE) {
				console.log('cleaned article', articleContent)
			}
		} else {
			console.log('using original article version')
			articleContent = await readFile(local_file_path, 'utf8');
			if (!articleContent) {
				throw new Error("File is empty");
			}
			if (process.env.VERBOSE) {
				console.log('original article', articleContent)
			}
		}
		await writeFile(`${STORAGE_PATH}/clean-${articleId}.txt`, articleContent);
		const metadata : ArticleMetadata = await getMetadata(articleContent);


		let instructions_podcast;
		if (metadata.article_type === "discussion") {
			instructions_podcast = base_instructions.discussion_podcast;
		} else {
			instructions_podcast = base_instructions.worksheet_podcast;
		}
		// if article is over 2000 tokens, we will use chunking method
		let tokens = countTokens(articleContent, instructions_podcast.GPTModel.version as ChatModel, instructions_podcast.type);
		let scriptStep;
		// if the article is less than 100,000 tokens, we will use chunking method
		// otherwise we will throw an error
		if (tokens < 100000) {
			scriptStep = await promptLLMChunks(articleContent, instructions_podcast, metadata);
		} else {
			throw new Error("Article is too long");
		}
		if (scriptStep.status === ProcessingStatus.ERROR) throw new Error(scriptStep.message);
		let script_file_path = `${uuidv4().toString()}.json`;
		const newScript = new Script(scriptStep.script, metadata.title, metadata.authors, script_file_path);
		console.log("we are now going to humanize the script");
		// humanize the script
		let humanizedScript = await humanizer(newScript);
		console.log("we are now going to save the script");
		await saveScript(humanizedScript, script_file_path);
		newPod.author = metadata.authors[0];
		newPod.title = metadata.title;
		newPod.created_at = new Date();
		await createMongoData('pods', newPod, mode);
		await updateMongoArrayDoc('users', user_id, 'pods', newPod._id, mode);
		return {
			status: ProcessingStatus.SUCCESS,
			step: "script",
			message: "Script created",
			script: newScript,
			theme: scriptStep.theme
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
 * Chop into n tokens with overlap
 * @param text The input text to tokenize
 * @param n The number of tokens to return
 * @param model Optional GPT model name to determine encoding (defaults to 'gpt-4')
 * @returns The text corresponding to the first n tokens
 */
export async function chopIntoNTokens(
	text: string,
	n: number,
	model: TiktokenModel = "gpt-4o",
	overlap: number = 0
): Promise<string[]> {
	// Get the appropriate encoding for the model
	const encoding = encoding_for_model(model);
	console.log('chopIntoNTokens', model, "num tokens", n, "overlap", overlap)
	// Encode the full text to tokens
	const all_tokens = encoding.encode(text);
	let chunks: string[] = [];
	for (let i = 0; i < all_tokens.length; i += n - overlap) {
		chunks.push(new TextDecoder().decode(encoding.decode(all_tokens.slice(i, i + n))));
		// console.log(chunks[chunks.length-1])
	}
	encoding.free();

	return chunks;
}
