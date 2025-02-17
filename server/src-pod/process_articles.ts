import { convertToTXT } from '@pod/convert_pdfs.js';
import { uploadFileToS3 } from '@pod/s3_files.js';
import { getMongoDataById, updateMongoData, createMongoData, updateMongoArrayDoc } from '@db/mongo_methods.js';
import { ObjectId } from 'bson';
import fs from 'fs';
import { ProcessingStatus, ProcessingStep } from '@shared/processing.js';
import { STORAGE_PATH } from '@pod/init.js';
/**
 * processArticles: saving articles to s3 and mongo
 * 1. upload file to s3
 * 2. create article in mongo
 * 3. return fileKey and file_path
 */
export const processArticles = async (file: Express.Multer.File) => {
	let originalPath = file.path;
	let file_path;
	let article_id;
	if (file.mimetype != 'text/plain') {
		let convert_txt_resp = await convertToTXT(file, `${STORAGE_PATH}`);
		if (convert_txt_resp == null) {
			throw new Error('Failed to convert file, try again');
		}
		file = convert_txt_resp.updated_file;
		file_path = convert_txt_resp.path;
		article_id = convert_txt_resp.article_id;
	} else {
		file_path = originalPath;
		article_id = file.filename.split('.')[0];
	}

	// upload to s3
	return {
		status: ProcessingStatus.SUCCESS,
		step: "article",
		file_path: file_path,
		article_id: article_id,
		message: "Article processing in progress"
	} as ProcessingStep;
};

export async function uploadCleanedArticleToS3(articleId: string, local_file_path: string, _id: ObjectId) {
	const articleKey = `cleaned_articles/${articleId.toString()}.txt`;
	let file = fs.readFileSync(local_file_path);
	let uploadDetails = {
		Bucket: 'main-server',
		Key: articleKey,
		Body: file
	}
	const uploadResponse = await uploadFileToS3(uploadDetails);
	return uploadResponse;
}

export async function uploadArticleToS3(articleId: string, local_file_path: string, _id: ObjectId) {
	const articleKey = `articles/${articleId.toString()}.txt`;
	let file = fs.readFileSync(local_file_path);
	let uploadDetails = {
		Bucket: 'main-server',
		Key: articleKey,
		Body: file
	}
	const uploadResponse = await uploadFileToS3(uploadDetails);
	return uploadResponse;
}

export async function uploadScriptToS3(scriptId: string, local_file_path: string, _id: ObjectId) {
	const scriptKey = `scripts/${scriptId.toString()}`;
	let file = fs.readFileSync(local_file_path);
	let uploadDetails = {
		Bucket: 'main-server',
		Key: scriptKey,
		Body: file
	}
	const uploadResponse = await uploadFileToS3(uploadDetails);
	return uploadResponse;
}