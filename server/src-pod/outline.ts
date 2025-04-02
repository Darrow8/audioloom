// we will get an outline for the script of the podcast

import { openaiClient } from "@pod/init.js";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ChatCompletionMessageParam } from "openai/resources";
import { Line, CharLine, MusicLine, LineKind, MusicType } from "@shared/line.js";
import { v4 as uuidv4 } from 'uuid';

const outlineSchema = z.object({
    title: z.string(),
    introduction: z.string(),
    main_points: z.array(z.object({
        point: z.string(),
        description: z.string(),
        estimated_duration: z.number()
    })),
    conclusion: z.string(),
    total_duration: z.number()
});

export interface PodcastOutline {
    title: string;
    introduction: string;
    main_points: {
        point: string;
        description: string;
        estimated_duration: number;
    }[];
    conclusion: string;
    total_duration: number;
}

export async function generatePodcastOutline(article: string): Promise<PodcastOutline> {
    const systemPrompt = `
        You are an expert podcast producer. Your task is to create a detailed outline for a podcast episode based on the provided article.
        
        The outline should include:
        1. A compelling title
        2. An engaging introduction that hooks the listener
        3. 3-5 main points that break down the article's content
        4. A strong conclusion that wraps up the key takeaways
        
        For each main point, provide:
        - A clear, concise point statement
        - A brief description of what will be covered
        - An estimated duration in minutes
        
        The total duration should be between 10-30 minutes.
        
        Format the response as a structured outline that maintains the listener's interest while effectively communicating the article's content.
    `;

    const messages: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: systemPrompt
        },
        {
            role: "user",
            content: article
        }
    ];

    const response = await openaiClient.beta.chat.completions.parse({
        model: "gpt-4",
        messages: messages,
        response_format: zodResponseFormat(outlineSchema, "outline")
    });

    return response.choices[0].message.parsed as PodcastOutline;
}

export async function generateScriptLinesFromOutline(outline: PodcastOutline): Promise<Line[]> {
    const systemPrompt = `
        You are an expert podcast script writer. Your task is to convert a podcast outline into detailed script lines.
        
        Each line should be either:
        1. A character line (dialogue) with:
           - A character name (e.g., "Adam Page" for the host)
           - The dialogue text
           - An adjective describing the tone (e.g., "enthusiastic", "thoughtful", "curious")
        
        2. A music line with:
           - Type: "Background Music" or "Sound Effect"
           - A description of the music/sound (e.g., "upbeat background music", "transition sound effect")
        
        The script should follow this structure:
        1. Introduction with background music
        2. For each main point:
           - Host introduces the point
           - Background music for transition
           - Discussion of the point
           - Sound effect for emphasis if needed
        3. Conclusion with background music
        
        Make the dialogue natural and engaging, as if real people are having a conversation.
    `;

    const messages: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: systemPrompt
        },
        {
            role: "user",
            content: JSON.stringify(outline)
        }
    ];

    const scriptSchema = z.object({
        lines: z.array(z.discriminatedUnion("kind", [
            z.object({
                kind: z.literal("character"),
                character: z.string(),
                dialogue: z.string(),
                adjective: z.string(),
                order: z.number()
            }),
            z.object({
                kind: z.literal("music"),
                type: z.enum(["Background Music", "Sound Effect"]),
                music_description: z.string(),
                order: z.number()
            })
        ]))
    });

    const response = await openaiClient.beta.chat.completions.parse({
        model: "gpt-4",
        messages: messages,
        response_format: zodResponseFormat(scriptSchema, "script")
    });

    const scriptLines = response.choices[0].message.parsed.lines;
    
    // Convert the parsed lines into proper Line objects
    return scriptLines.map(line => {
        if (line.kind === "character") {
            return new CharLine(
                line.dialogue,
                line.character,
                line.adjective,
                line.order,
                uuidv4(),
                LineKind.CHARACTER
            );
        } else {
            return new MusicLine(
                line.type === "Background Music" ? MusicType.BMusic : MusicType.SFX,
                line.music_description,
                line.order,
                uuidv4(),
                LineKind.MUSIC
            );
        }
    });
}

