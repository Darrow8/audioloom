import { Script, BaseScriptSchema } from "@shared/script.js";
import { zodResponseFormat } from "openai/helpers/zod";
import { openaiClient } from "./init.js";
import { CharLine, LineKind, MusicLine } from "@shared/line.js";
import { Line } from "@shared/line.js";
import { ChatCompletionMessageParam } from "openai/resources/index.js";
export async function humanizer(script: Script): Promise<Script> {
	const prompt = `
	
	You are given a script for a podcast and you need to make it sound more human. Right now the script does not sound like humans are talking to each other.
	 Currently, the script feels somewhat formal and structured. Please rewrite it to sound more conversational, natural, and engaging, as if knowledgeable colleagues are casually yet thoughtfully discussing the topic. Preserve the informative content, but adjust phrasing, transitions, and interactions to flow organically. Incorporate pauses, reactions, and conversational cues to enhance authenticity.
	
	Each entry in the lines array is a segment of the episode, which can be a character's spoken line or a piece of background music. Please analyze and explain the structure of this template. Here's what each field in the JSON means:
	
	"kind": Specifies whether the line is a "character" (dialogue) or "music" (sound cue).

	"character" (only if kind is character): The speaker's name (e.g., "Adam Page").

	"dialogue" (only if kind is character): The actual spoken line.

	"adjective" (only if kind is character): Describes the tone or delivery style of the dialogue.

	"type" (only if kind is music): Describes the category of music (e.g., "Background Music").

	"music_description" (only if kind is music): Describes the mood or style of the music.

	"id": A unique identifier for the line.

	"order": The sequence number of the line within the episode.

	There is also metadata at the top level:

	"title": The episode title.

	"authors": A list of contributors.

	"lineCount": The total number of lines in the script.

	"filename": The filename of the JSON file.
	 `
	const messages: ChatCompletionMessageParam[] = [
		{
			role: "system",
			content: prompt
		},
		{
			role: "user",
			content: scriptToString(script)
		}
	];


	let response = await openaiClient.beta.chat.completions.parse({
		model: "gpt-4o",
		messages: messages,
		response_format: zodResponseFormat(BaseScriptSchema, "script"),
	});

	if (process.env.VERBOSE) {
		console.log('OpenAI Response:', JSON.stringify(response, null, 2));
	}

	let lines = response.choices[0].message.parsed as Line[];
	if (process.env.VERBOSE) {
		console.log('Parsed Lines:', JSON.stringify(lines, null, 2));
	}

	let script_result = new Script(lines, script.title, script.authors, script.filename);
	if (process.env.VERBOSE) {
		console.log('Generated Script:', JSON.stringify(script_result, null, 2));
	}

	return script_result;
}

function scriptToString(script: Script): string {
	// Convert script lines to string representation
	const lineStrings = script.lines.map(line => {
		if (line.kind == LineKind.CHARACTER) {  // This is a CharLine
			let charLine = line as CharLine;
			return `${charLine.character}: ${charLine.dialogue}`;
		} else {  // This is a MusicLine
			let musicLine = line as MusicLine;
			return `${musicLine.type}: ${musicLine.music_description}`;
		}
	});

	// Build full script string with metadata
	const scriptString = lineStrings.join("\n");

	return scriptString;
}
