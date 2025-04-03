import openaiClient from "./openai_client";
import { ReadStream } from "fs";

/**
 * Creates a new vector store
 * @param storeName The name of the vector store
 * @returns The vector store details
 */
export async function createVectorStore(storeName: string): Promise<{ id: string; name: string; created_at: number; file_count: number }> {
	try {
		const response = await openaiClient.vectorStores.create({
			name: storeName
		});

		return {
			id: response.id,
			name: response.name,
			created_at: response.created_at,
			file_count: response.file_counts.completed
		};
	} catch (error) {
		console.error("Error creating vector store:", error);
		throw error;
	}
}

/**
 * Uploads a file to OpenAI
 * @param input_file The file to upload
 * @returns The file ID and upload status
 */
export async function uploadFile(
	input_file: ReadStream
): Promise<{ status: "success" | "failed"; error?: string; file_id?: string }> {
	try {
		const file = await openaiClient.files.create({
			file: input_file,
			purpose: "user_data",
		});

		return { status: "success", file_id: file.id };
	} catch (error) {
		console.error("Error uploading file:", error);
		return { status: "failed", error: error instanceof Error ? error.message : "Unknown error" };
	}
}

/**
 * Attaches a file to a vector store
 * @param file_id The ID of the file to attach
 * @param vectorStoreId The ID of the vector store
 * @returns The attachment status
 */
export async function attachFileToVectorStore(
	file_id: string,
	vectorStoreId: string
): Promise<{ status: "success" | "failed"; error?: string }> {
	try {
		const response = await openaiClient.vectorStores.files.create(
			vectorStoreId,
			{
				file_id: file_id
			}
		);

		console.log("File attached to vector store:", response);
		console.log(response.status);

		return { status: "success" };
	} catch (error) {
		console.error("Error attaching file to vector store:", error);
		return { status: "failed", error: error instanceof Error ? error.message : "Unknown error" };
	}
}

/**
 * Uploads a single article to the vector store
 * @param input_file The article content to save
 * @param vectorStoreId The ID of the vector store to upload to
 * @returns The upload status
 */
export async function uploadArticleToVectorStore(
	input_file: ReadStream,
	vectorStoreId: string
): Promise<{ status: "success" | "failed"; error?: string; file_id?: string }> {
	try {
		// Upload the file first
		const uploadResult = await uploadFile(input_file);
		if (uploadResult.status === "failed") {
			return uploadResult;
		}

		// Then attach it to the vector store
		const attachResult = await attachFileToVectorStore(uploadResult.file_id!, vectorStoreId);
		if (attachResult.status === "failed") {
			return { ...attachResult, file_id: uploadResult.file_id };
		}

		return { status: "success", file_id: uploadResult.file_id };
	} catch (error) {
		console.error("Error in uploadArticleToVectorStore:", error);
		return { status: "failed", error: error instanceof Error ? error.message : "Unknown error" };
	}
}
