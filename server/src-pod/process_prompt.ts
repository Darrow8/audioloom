import { ProcessingStatus, ProcessingStep } from "@shared/processing.js";
import { BaseScriptSchema, BaseScriptType, FullLLMPrompt, FullPrompts, GPTModel, InstructionType, PromptLLM, RawPrompts } from "@shared/script.js";
import { chopIntoNTokens, countTokens } from "@pod/process_script.js";
import { openaiClient } from "@pod/init.js";
import fs from "fs";
import { getFileFromS3 } from "@pod/pass_files.js";
import { ChatModel } from "openai/resources";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ChatCompletionMessageParam } from "openai/resources";
import { TiktokenModel } from "tiktoken";

const formats = {
    podcast: BaseScriptSchema,
    clean: z.object({
        article: z.string(),
    }),
    title: z.object({
        title: z.string()
    }),
    author: z.object({
        author: z.string()
    })
};

export async function promptLLM(articleName: string, instructions: FullLLMPrompt, type: InstructionType): Promise<ProcessingStep> {
    let intructionsTokens = countTokens(instructions.instructions, instructions.GPTModel.version, type);

    if (intructionsTokens > instructions.GPTModel.tokenLimit) {
        return {
            status: ProcessingStatus.ERROR,
            step: instructions.type,
            message: "Article + intructions has exceeded token limit, must split into batches"
        } as ProcessingStep;
    }

    let format: z.ZodType;
    let format_name: string;

    switch (type) {
        case InstructionType.PODCAST:
            format = formats.podcast;
            format_name = "podcast";
            break;
        case InstructionType.CLEAN:
            format = formats.clean;
            format_name = "clean";
            break;
        case InstructionType.TITLE:
            format = formats.title;
            format_name = "title";
            break;
        case InstructionType.AUTHOR:
            format = formats.author;
            format_name = "author";
            break;
    }

    const completion = await openaiClient.beta.chat.completions.parse({
        model: instructions.GPTModel.version as ChatModel,
        messages: [
            { role: "system", content: instructions.instructions },
        ],
        response_format: zodResponseFormat(format, format_name),
    });
    let response = completion.choices[0].message.parsed;
    console.log(response);
    let parsedResponse;
    switch (type) {
        case InstructionType.PODCAST:
            parsedResponse = BaseScriptSchema.parse(response);
            break;
        case InstructionType.CLEAN:
            parsedResponse = formats.clean.parse(response);
            break;
        case InstructionType.TITLE:
            parsedResponse = formats.title.parse(response);
            break;
        case InstructionType.AUTHOR:
            parsedResponse = formats.author.parse(response);
            break;
    }
    console.log(parsedResponse);
    return {
        status: ProcessingStatus.IN_PROGRESS,
        step: instructions.type,
        message: "Prompt completed",
        data: parsedResponse
    } as ProcessingStep;
}


/**
 * We will prompt the LLM in chunks of 1000 tokens
 */
export async function promptLLMChunks(article: string, instructions: PromptLLM) {
    let tokens = countTokens(article, instructions.GPTModel.version as ChatModel, InstructionType.PODCAST);
    let { chunk_size, chunk_overlap, minutes } = determineChunkSize(tokens, instructions);
    console.log(`chunk_size: ${chunk_size}`);
    console.log(`chunk_overlap: ${chunk_overlap}`);
    console.log(`minutes: ${minutes}`);
    let article_by_chunks: string[] = [];
    // step 1: split the article into chunks
    article_by_chunks = await chopIntoNTokens(article, chunk_size, instructions.GPTModel.version as TiktokenModel, chunk_overlap);
    console.log(article_by_chunks);
    // step 2: prompt the LLM in chunks
    let full_script: BaseScriptType[] = [];
    let format: z.ZodType = formats.podcast;
    let format_name: string = "podcast";
    let init_instructions = instructions.raw_instructions;
    let wpm = 150;
    const wordCount = article.trim().split(/\s+/).length;
    console.log(`wordCount: ${wordCount}`);
    let additionalInstructions = `\n Please ensure the podcast script has enough content and discussion to fill around ${minutes} minutes considering the average talking speed of ${wpm} words per minute. This means that the total amount of dialogue should be about ${minutes * wpm} words long.`;
    init_instructions += additionalInstructions;
    let chunking_instructions = `This podcast is split into ${article_by_chunks.length+1} parts. Please write the script for the part number you are given. The parts of the script will be joined together seamlessly, so do not reintroduce guests or welcome the listener back, instead pick up from where the last part left off.`;
    init_instructions += chunking_instructions;

    let messages: ChatCompletionMessageParam[] = [{ role: "system", content: init_instructions }];
    for (let i = 0; i < article_by_chunks.length; i++) {
        let chunk = article_by_chunks[i];
        let supplemental_instructions = "";
        if(i === 0) {
            supplemental_instructions = `This is the first part of the podcast. Please welcome the listener back and introduce the topic of the podcast.`;
        } else if (i == article_by_chunks.length - 1) {
            supplemental_instructions = `This is the last part of the podcast. Please try to paint a larger picture of the topic and explain why the topic is important.`;
        } else {
            supplemental_instructions = `This is part ${i+1} of the podcast. Please continue the podcast and do not welcome the listener back as this is not the first part and each part will be joined together seamlessly.`;
        }
        messages.push({ role: "user", content: `This is part ${i+1} of the podcast. ${supplemental_instructions} PART_${i+1}_START\n${chunk}\nPART_${i+1}_END. Write only about this part of the script in this response.` });
        let response = await openaiClient.beta.chat.completions.parse({
            model: instructions.GPTModel.version as ChatModel,
            messages: messages,
            response_format: zodResponseFormat(format, format_name),
        });
        let parsedResponse = BaseScriptSchema.parse(response.choices[0].message.parsed);

        let assistant_message = parsedResponse.lines.map((line) => {
            if(line.kind === "character") {
                return `${line.character}: ${line.dialogue}`;
            }else if(line.kind === "music") {
                if(line.type === "Background Music") {
                    return `Background music: ${line.music_description}`;
                } else if (line.type === "Sound Effect") {
                    return `Sound effect: ${line.music_description}`;
                }
            }
        }).join("\n");
        messages.push({ role: "assistant", content: `Already written part ${i+1} of the podcast: PART_${i+1}_START\n${assistant_message}\nPART_${i+1}_END` });
        full_script.push(parsedResponse);
    }
    console.log(messages)
    // step 3: merge the chunks
    let merged_script: BaseScriptType = {
        lines: full_script.flatMap(script => script.lines)
    };
    console.log(merged_script);

    return {
        status: ProcessingStatus.IN_PROGRESS,
        step: "podcast chunking",
        message: "Prompt completed",
        data: merged_script
    } as ProcessingStep;
}

/**
 * 
 * calculation: tokens spoken per minute is 195 (1.3 token/word * 150wpm), so 1000 tokens is 2000/195 is roughly 10 minutes but we are simplifying content so we will use 2/3ds of that getting 6.67 minutes
 * we want to cap the minutes at 30 minutes and the chunks at 10
 * each LLM call generates ~5 mins of content 
 * @param tokens 
 * @param instructions 
 * @returns 
 */
function determineChunkSize(tokens: number, instructions: PromptLLM): { chunk_size: number, chunk_overlap: number, minutes: number } {
    let tpm = 195;
    let minutes = Math.min(30, Math.round((tokens / tpm) * 2 / 3));  // Cap at 30 minutes
    
    // Calculate required chunks based on ~5 mins content per chunk
    let required_chunks = Math.ceil(minutes / 5);
    required_chunks = Math.min(10, required_chunks);  // Cap at 10 chunks
    
    // Adjust chunk size based on required chunks, ensuring even distribution
    let chunk_size = Math.ceil(tokens / required_chunks);
    let chunk_overlap = Math.min(100, Math.floor(chunk_size * 0.1));  // 10% overlap, max 100 tokens
    
    return { chunk_size, chunk_overlap, minutes };
}

export function saveLocalFile(fileName: string, content: string) {
    fs.writeFileSync(`${fileName}`, content);
}

export async function localInstructions(): Promise<RawPrompts> {
    const rawData = fs.readFileSync('prompts/model_prompts.json', 'utf8');
    return JSON.parse(rawData) as RawPrompts;
}