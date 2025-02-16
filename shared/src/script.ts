import { JSONSchema } from "openai/lib/jsonschema";
import { ChatModel, ResponseFormatJSONSchema } from "openai/resources"
import { z } from "zod";
import { Line, CharLine, MusicLine, LineUnionSchema } from "./line.js";
/**
 * Represents a script containing various lines, a title, and authors.
 */
export class Script {
    lines: Line[];
    title: string;
    authors: string[];
    lineCount: number;
    filename: string;
    /**
     * Creates an instance of the Script class.
     * @param lines - An array of Line objects that make up the script.
     * @param title - The title of the script.
     * @param authors - An array of authors of the script.
     */
    constructor(lines: Line[], title: string, authors: string[], file_path: string) {
        this.lines = lines;
        this.title = title;
        this.authors = authors;
        this.lineCount = lines.length;
        this.filename = file_path;
    }

    /**
     * Gets all music lines from the script.
     * @returns An array of MusicLine objects.
     */
    getMusicLines(): MusicLine[] {
        return this.lines.filter(line => line.kind === 'music') as MusicLine[];
    }

    /**
     * Gets all character lines from the script.
     * @returns An array of CharLine objects.
     */
    getCharLines(): CharLine[] {
        return this.lines.filter(line => line.kind === 'character') as CharLine[];
    }
}


export type LineUnionType = (CharLineType | MusicLineType);

export interface CharLineType {
    kind: "character";
    character: string;
    dialogue: string;
    adjective: string;
}

export interface MusicLineType {
    kind: "music";
    type: "Background Music" | "Sound Effect";
    music_description: string;
}
export const BaseScriptSchema = z.object({
    lines: z.array(LineUnionSchema)
});

export type BaseScriptType = z.infer<typeof BaseScriptSchema>;

export enum InstructionType {
    CLEAN = "clean",
    DISCUSSION_PODCAST = "discussion_podcast",
    WORKSHEET_PODCAST = "worksheet_podcast",
    TITLE = "title",
    AUTHOR = "author"
}

export type GPTModel = {
    version: ChatModel,
    tokenLimit: number
}

export interface PromptLLM {
    type: InstructionType;
    raw_instructions?: string;
    response_type: 'file' | 'string';
    GPTModel: GPTModel;
}

export interface FullLLMPrompt extends PromptLLM {
    instructions: string;
}

export interface RawPrompts {
    clean: PromptLLM;
    discussion_podcast: PromptLLM;
    worksheet_podcast: PromptLLM;
    title: PromptLLM;
    author: PromptLLM;
}
// export interface FullPrompts {
//     clean: FullLLMPrompt;
//     discussion_podcast: FullLLMPrompt;
//     worksheet_podcast: FullLLMPrompt;
//     title: FullLLMPrompt;
//     author: FullLLMPrompt;
// }