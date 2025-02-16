import { ProcessingStatus, ProcessingStep } from "@shared/processing.js";
import { BaseScriptSchema, BaseScriptType, PromptLLM, RawPrompts } from "@shared/script.js";
import { chopIntoNTokens, countTokens } from "@pod/process_script.js";
import { openaiClient } from "@pod/init.js";
import fs from "fs";
import { getFileFromS3 } from "@pod/pass_files.js";
import { ChatModel } from "openai/resources";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ChatCompletionMessageParam } from "openai/resources";
import { TiktokenModel } from "tiktoken";
import { themeChooser } from "@pod/process_track.js";
import { base_instructions } from "@pod/pod_main.js";

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

/**
 * We will prompt the LLM in chunks of 1000 tokens
 */
export async function promptLLMChunks(article: string, instructions: PromptLLM) {
    let tokens = countTokens(article, instructions.GPTModel.version as ChatModel, instructions.type);
    let { chunk_size, chunk_overlap, minutes } = determineChunkSize(tokens, instructions);
    console.log(`chunk_size: ${chunk_size}`);
    console.log(`chunk_overlap: ${chunk_overlap}`);
    console.log(`minutes: ${minutes}`);
    let article_by_chunks: string[] = [];
    let summary = await summarizer(article);
    let theme = await themeChooser(summary);
    console.log(`theme: ${theme.genre}, ${theme.mood}`);
    // console.log(`summary: ${summary}`);
    // step 1: split the article into chunks
    article_by_chunks = await chopIntoNTokens(article, chunk_size, instructions.GPTModel.version as TiktokenModel, chunk_overlap);
    // step 2: prompt the LLM in chunks
    let full_script: BaseScriptType[] = [];
    let format: z.ZodType = formats.podcast;
    let format_name: string = "podcast";
    let init_instructions = instructions.raw_instructions;
    let wpm = 150;
    const wordCount = article.trim().split(/\s+/).length;
    console.log(`wordCount: ${wordCount}`);
    let additionalInstructions = `\n Please ensure the podcast script has enough content to fill around ${minutes} minutes considering the average talking speed of ${wpm} words per minute. This means that the total amount of dialogue should be about ${minutes * wpm} words long.`;
    init_instructions += additionalInstructions;
    let chunking_instructions = `This podcast is split into ${article_by_chunks.length} parts. Please write the script for the part number you are given. The parts of the script will be joined together seamlessly, so do not reintroduce guests or welcome the listener back, instead pick up from where the last part left off.`;
    init_instructions += chunking_instructions;
    init_instructions += `\n The summary of the article is: ${summary}`;
    let messages: ChatCompletionMessageParam[] = [{ role: "system", content: init_instructions }];
    for (let i = 0; i < article_by_chunks.length; i++) {
        let chunk = article_by_chunks[i];
        let supplemental_instructions = "";
        if (article_by_chunks.length > 1) {
            if (i === 0) {
                supplemental_instructions = `This is the first part of the podcast. Please welcome the listener back and introduce the topic of the podcast.`;
            } else if (i == article_by_chunks.length - 1) {
                supplemental_instructions = `This is the last part of the podcast. Focus on concluding the podcast and thanking the listener for listening.`;
            } else {
                supplemental_instructions = `This is part ${i + 1} of the podcast. Please continue the podcast and do not welcome the listener back as this is not the first part and each part will be joined together seamlessly.`;
            }
            messages.push({ role: "user", content: `This is part ${i + 1} of the podcast. ${supplemental_instructions} PART_${i + 1}_START\n${chunk}\nPART_${i + 1}_END. Write only about this part of the script in this response.` });
        } else {
            supplemental_instructions = `This is the only part of the podcast. Please welcome the listener to the podcast and introduce the topic of the podcast. End with a conclusion and thank the listener for listening.`;
            messages.push({ role: "user", content: `${supplemental_instructions} START\n${chunk}\nEND.` });

        }
        let response = await openaiClient.beta.chat.completions.parse({
            model: instructions.GPTModel.version as ChatModel,
            messages: messages,
            response_format: zodResponseFormat(format, format_name),
        });
        let parsedResponse = BaseScriptSchema.parse(response.choices[0].message.parsed);

        let assistant_message = parsedResponse.lines.map((line) => {
            if (line.kind === "character") {
                return `${line.character}: ${line.dialogue}`;
            } else if (line.kind === "music") {
                if (line.type === "Background Music") {
                    return `Background music: ${line.music_description}`;
                } else if (line.type === "Sound Effect") {
                    return `Sound effect: ${line.music_description}`;
                }
            }
        }).join("\n");
        messages.push({ role: "assistant", content: `Already written part ${i + 1} of the podcast: PART_${i + 1}_START\n${assistant_message}\nPART_${i + 1}_END` });
        full_script.push(parsedResponse);
    }
    // step 3: merge the chunks
    let merged_script: BaseScriptType = {
        lines: full_script.flatMap(script => script.lines)
    };

    return {
        status: ProcessingStatus.IN_PROGRESS,
        step: "podcast chunking",
        message: "Prompt completed",
        data: merged_script,
        theme: theme
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

    if (tokens > 0 && tokens < 5000) {
        // 1 chunk, 1*5 mins so ~5 mins
        return {
            chunk_size: tokens,
            chunk_overlap: 0,
            minutes: 5
        }
    } else if (tokens >= 5000 && tokens < 10000) {
        // 2 chunks, 2*5 mins so ~10 mins
        return {
            chunk_size: Math.ceil(tokens / 2),
            chunk_overlap: Math.ceil(tokens * 0.1),
            minutes: 10
        }
    } else if (tokens >= 10000 && tokens < 20000) {
        // 3 chunks, 3*5 mins so ~15 mins
        return {
            chunk_size: Math.ceil(tokens / 3),
            chunk_overlap: Math.ceil(tokens * 0.05),
            minutes: 15
        }
    } else if (tokens >= 20000 && tokens < 30000) {
        // 4 chunks, 4*5 mins so ~20 mins
        return {
            chunk_size: Math.ceil(tokens / 4),
            chunk_overlap: Math.ceil(tokens * 0.04),
            minutes: 20
        }
    } else if (tokens >= 30000 && tokens < 40000) {
        // 5 chunks, 5*5 mins so ~25 mins
        return {
            chunk_size: Math.ceil(tokens / 5),
            chunk_overlap: Math.ceil(tokens * 0.03),
            minutes: 25
        }
    } else if (tokens >= 40000 && tokens < 50000) {
        // 6 chunks, 6*5 mins so ~30 mins
        return {
            chunk_size: Math.ceil(tokens / 6),
            chunk_overlap: Math.ceil(tokens * 0.02),
            minutes: 30
        }
    } else if (tokens >= 50000) {
        // 7 chunks, 7*5 mins so ~35 mins
        return {
            chunk_size: Math.ceil(tokens / 7),
            chunk_overlap: Math.ceil(tokens * 0.02),
            minutes: 35
        }
    }
}


export async function summarizer(article: string) {
    let summary_instructions = `Summarize the article into a short paragraph.`;
    const completion = await openaiClient.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: summary_instructions },
            { role: "user", content: article }
        ],
    });

    let summary = completion.choices[0].message.content;
    return summary;
}

// get title
export async function getTitle(articleContent: string): Promise<ProcessingStep> {
    let instructions = base_instructions.title;
    const completion = await openaiClient.beta.chat.completions.parse({
        model: instructions.GPTModel.version as ChatModel,
        messages: [
            { role: "system", content: instructions.raw_instructions },
            { role: "user", content: articleContent }
        ],
        response_format: zodResponseFormat(formats.title, "title")
    });

    let title = completion.choices[0].message.parsed.title;
    return {
        status: ProcessingStatus.IN_PROGRESS,
        step: "title",
        message: "Prompt completed",
        data: title,
    } as ProcessingStep;
}

// get author
export async function getAuthor(articleContent: string): Promise<ProcessingStep> {
    let instructions = base_instructions.author;
    const completion = await openaiClient.beta.chat.completions.parse({
        model: instructions.GPTModel.version as ChatModel,
        messages: [
            { role: "system", content: instructions.raw_instructions },
            { role: "user", content: articleContent }
        ],
        response_format: zodResponseFormat(formats.author, "author")
    });

    let author = completion.choices[0].message.parsed.author;
    return {
        status: ProcessingStatus.IN_PROGRESS,
        step: "author",
        message: "Prompt completed",
        data: author,
    } as ProcessingStep;
}

export async function determineTypeOfArticle(article: string) {
    let type_instructions = `Your job is to determine the type of document a user has uploaded for podcast creation.
    If the document makes an argument or focuses on a specific topic that is suitable for a discussion podcast, return "discussion".
    If the document is a worksheet or quiz that is suitable for a Q&A podcast, return "worksheet".
    Return only one of the following: "discussion" or "worksheet".`;

    const typeFormat = z.object({
        type: z.enum(["discussion", "worksheet"])
    });

    const completion = await openaiClient.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: type_instructions },
            { role: "user", content: article }
        ],
        response_format: zodResponseFormat(typeFormat, "type")
    });
    
    let type = completion.choices[0].message.parsed.type;
    return type;
}
export function saveLocalFile(fileName: string, content: string) {
    fs.writeFileSync(`${fileName}`, content);
}

export async function localInstructions(): Promise<RawPrompts> {
    const rawData = fs.readFileSync('prompts/model_prompts.json', 'utf8');
    return JSON.parse(rawData) as RawPrompts;
}