import { ProcessingStatus, ProcessingStep } from "@shared/processing.js";
import { BaseScriptSchema, FullLLMPrompt, FullPrompts, GPTModel, InstructionType, PromptLLM, RawPrompts } from "@shared/script.js";
import { countTokens } from "@pod/process_script.js";
import { openaiClient } from "@pod/init.js";
import fs from "fs";
import { getFileFromS3 } from "@pod/pass_files.js";
import { ChatModel } from "openai/resources";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ChatCompletionMessageParam } from "openai/resources";

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
export async function promptLLMChunks(article: string, raw_instructions: FullLLMPrompt, chunkSize:number=1000, chunkOverlap:number=100){
    let article_by_chunks = [];
    // step 1: split the article into chunks
    

    
    let full_script = [];
    let format: z.ZodType = formats.podcast;
    let format_name: string = "podcast";
    let messages : ChatCompletionMessageParam[] = [{ role: "system", content: raw_instructions.instructions }];
    let response = await openaiClient.beta.chat.completions.parse({
        model: raw_instructions.GPTModel.version as ChatModel,
        messages: messages,
        response_format: zodResponseFormat(format, format_name),
    });

}


export function saveLocalFile(fileName: string, content: string) {
    fs.writeFileSync(`${fileName}`, content);
}

export async function localInstructions(): Promise<RawPrompts> {
    const rawData = fs.readFileSync('prompts/model_prompts.json', 'utf8');
    return JSON.parse(rawData) as RawPrompts;
}