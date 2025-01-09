import { ProcessingStatus, ProcessingStep } from "@shared/processing.js";
import { BaseScriptSchema, FullLLMPrompt, FullPrompts, GPTModel, InstructionType, PromptLLM, RawPrompts, ScriptSchema } from "@shared/script.js";
import { countTokens } from "@pod/process_script.js";
import { openaiClient } from "@pod/init.js";
import fs from "fs";
import { getFileFromS3 } from "@pod/pass_files.js";
import { ChatModel } from "openai/resources";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// const BaseFormat = z.object({
//   type: z.enum(['podcast', 'clean', 'title', 'author'])
// });

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

export async function promptLLM(articleName: string, instructions: FullLLMPrompt): Promise<ProcessingStep> {
    let intructionsTokens = countTokens(instructions.instructions, instructions.GPTModel.version);
    
    if (intructionsTokens > instructions.GPTModel.tokenLimit) {
        return {
            status: ProcessingStatus.ERROR,
            step: instructions.type,
            message: "Article + intructions has exceeded token limit, must split into batches"
        } as ProcessingStep;
    }

    let format: z.ZodType;
    let format_name: string;

    switch (instructions.type) {
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
        default:
            throw new Error(`Unknown instruction type: ${instructions.type}`);
    }

    const completion = await openaiClient.beta.chat.completions.parse({
        model: instructions.GPTModel.version as ChatModel,
        messages: [
            { role: "system", content: instructions.instructions },
        ],
        response_format: zodResponseFormat(format, format_name),
    });
    console.log(completion.choices[0].message.parsed);
    return {
        status: ProcessingStatus.IN_PROGRESS,
        step: instructions.type,
        message: "Prompt completed",
        data: completion.choices[0].message.parsed
    } as ProcessingStep;
}

export function saveLocalFile(fileName: string, content: string) {
    fs.writeFileSync(`${fileName}`, content);
}

export async function localInstructions(): Promise<RawPrompts> {
    const rawData = fs.readFileSync('prompts/model_prompts.json', 'utf8');
    return JSON.parse(rawData) as RawPrompts;
}