import { PodcastOutline } from "./types/podcast";
import openaiClient from "./openai_client";
import path from 'path';
import fs from 'fs';
import { ResponseOutputMessage, ResponseOutputText } from "openai/resources/responses/responses";

export function getPodcastOutline(): PodcastOutline {
    const filePath = path.join(__dirname, '../podcast_outline.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const outline = JSON.parse(fileContent) as PodcastOutline;
    return outline;
}

let model_prompt = `You are a podcast host. Generate engaging, conversational dialogue based on the given outline. Make it sound natural and engaging.`;

export async function generatePodcastDialogue(outline: PodcastOutline): Promise<{
    introduction: string;
    mainPoints: { title: string; content: string }[];
    conclusion: string;
}> {
    // Generate introduction dialogue
    const introductionResponse = await openaiClient.responses.create({
        model: "gpt-4",
        input: [
            {
                role: "user",
                content: `${model_prompt} Generate a podcast introduction based on this outline: ${outline.introduction}`
            }
        ]
    });

    // Generate dialogue for each main point sequentially
    const mainPoints = await Promise.all(outline.segments.map(async (segment) => {
        const response = await openaiClient.responses.create({
            model: "gpt-4",
            input: [
                {
                    role: "user",
                    content: `${model_prompt} Generate podcast dialogue for this segment: Title: ${segment.title}, Content: ${segment.content}`
                }
            ]
        });
        return {
            title: segment.title,
            content: ((response.output[0] as ResponseOutputMessage).content[0] as ResponseOutputText).text || ""
        };
    }));

    // Generate conclusion dialogue
    const conclusionResponse = await openaiClient.responses.create({
        model: "gpt-4",
        input: [
            {
                role: "user",
                content: `${model_prompt} Generate a podcast conclusion based on this outline: ${outline.conclusion}`
            }
        ]
    });

    const result = {
        introduction: ((introductionResponse.output[0] as ResponseOutputMessage).content[0] as ResponseOutputText).text || "",
        mainPoints,
        conclusion: ((conclusionResponse.output[0] as ResponseOutputMessage).content[0] as ResponseOutputText).text || ""
    };

    // Save the result to a file
    const outputPath = path.join(__dirname, '../podcast_dialogue.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Podcast dialogue saved to ${outputPath}`);

    return result;
}

let outline = getPodcastOutline();
console.log(outline);
generatePodcastDialogue(outline);