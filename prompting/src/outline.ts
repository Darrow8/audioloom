import { createReadStream, ReadStream } from 'fs';
import { Readable } from 'stream';
import openaiClient from "./openai_client";
import * as fs from 'fs';
import { ResponseInputFile, ResponseInputText, ResponseOutputMessage, ResponseOutputText } from 'openai/resources/responses/responses';
import { PodcastOutline, isPodcastOutline, getPodcastOutlineSchema, PodcastOutlineSchema } from './types/podcast';
import { zodResponseFormat } from 'openai/helpers/zod';
import { uploadArticleToVectorStore } from './vector_store';
import { createVectorStore } from './vector_store';


async function createOutline()/*: Promise<PodcastOutline>*/ {
	// Read and process the local PDF file
	const pdfPath = "./sample.pdf";
	const pdfContent = fs.createReadStream(pdfPath);
	let vectorStore = await createVectorStore("podcast-outline");

	// Upload the PDF content to the vector store
	const uploadResult = await uploadArticleToVectorStore(pdfContent, vectorStore.id);

	console.log("Upload result:", uploadResult);
	const response = await openaiClient.responses.create({
		model: "gpt-4o",
		input: [
			{
				role: "user",
				content: [
					{
						type: "input_text",
						text: `Generate the outline for a podcast teaching about the topic of the articles uploaded to the vector store`
					} as ResponseInputText
				]
			}
		],
		text: {
			format: {
				type: "json_schema",
				name: "podcast_outline",
				schema: getPodcastOutlineSchema()
			}
		},
		tools: [
			{
				type: "file_search",
				vector_store_ids: [vectorStore.id]
			}
		],
		store: true
	});

	// Save response to a local JSON file
	fs.writeFileSync('gpt_thinking.json', JSON.stringify(response, null, 2));

	let data = ((response.output[1] as ResponseOutputMessage).content[0] as ResponseOutputText).text;
	let parsedData = JSON.parse(data) as PodcastOutline;
	
	if (!isPodcastOutline(parsedData)) {
		throw new Error('Invalid podcast outline structure');
	}
	return parsedData;
}

createOutline();