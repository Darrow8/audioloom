import { convertToTXT } from '@pod/pass_convert.js';
import { uploadFileToS3 } from '@pod/pass_files.js';
import { upload, STORAGE_PATH } from '@pod/pod_main.js';
import { getMongoDataById, updateMongoData, createMongoData, updateMongoArrayDoc } from '@db/mongo_methods.js';
import { ObjectId } from 'bson';
import fs from 'fs';
import { ProcessingStatus, ProcessingStep } from '@shared/processing.js';

/**
 * processArticles: saving articles to s3 and mongo
 * 1. upload file to s3
 * 2. create article in mongo
 * 3. return fileKey and file_path
 */
export const processArticles = async (file: Express.Multer.File) => {
  console.log('processArticles file: ' + file)
  let originalPath = file.path;
  let file_path;
  if (file.mimetype != 'text/plain') {
    let convert_txt_resp = await convertToTXT(file, `${STORAGE_PATH}`);
    if (convert_txt_resp == null) {
      throw new Error('Failed to convert file, try again');
    }
    file = convert_txt_resp.updated_file;
    file_path = convert_txt_resp.path;
    console.log("updated file path: " + file_path);
  } else {
    file_path = originalPath;
    console.log("original file path: " + file_path);
  }

  // upload to s3

  return {
    status: ProcessingStatus.IN_PROGRESS,
    step:"article",
    file_path: file_path,
  } as ProcessingStep;
};

export async function uploadArticleToS3(local_file_path: string, _id: ObjectId) {
  const articleId = new ObjectId();
  const articleKey = `articles/${articleId.toString()}.txt`;
  let file = fs.readFileSync(local_file_path);
  let uploadDetails = {
    Bucket: 'main-server',
    Key: articleKey,
    Body: file
  }
  const uploadResponse = await uploadFileToS3(uploadDetails);
  if (uploadResponse.statusCode === 200) {
    let articleData = {
      _id: articleId,
      key: articleKey,
      uploadedAt: new Date(),
      uploadedBy: (_id)
    }
    let articleResult = await createMongoData('articles', articleData);
    if (articleResult) {
      await updateMongoArrayDoc('users', _id, "articles", articleId);
    } else {
      throw new Error('Failed to create article in mongo');
    }
    fs.unlinkSync(local_file_path);
  }
}
