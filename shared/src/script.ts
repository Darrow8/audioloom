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



// Base Script Schema is for when all we have is the lines
export const BaseScriptSchema = z.array(LineUnionSchema);
export type BaseScriptType = z.infer<typeof BaseScriptSchema>;

// Script schema
export const ScriptSchema = z.object({
    lines: z.array(LineUnionSchema),
    title: z.string(),
    authors: z.array(z.string()),
    lineCount: z.number(),
    file_path: z.string(),
  });
  
// Type inference
export type ScriptType = z.infer<typeof ScriptSchema>;
  
  

export enum InstructionType {
    CLEAN = "clean",
    PODCAST = "podcast",
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
    podcast: PromptLLM;
    title: PromptLLM;
    author: PromptLLM;
}
export interface FullPrompts {
    clean: FullLLMPrompt;
    podcast: FullLLMPrompt;
    title: FullLLMPrompt;
    author: FullLLMPrompt;
}