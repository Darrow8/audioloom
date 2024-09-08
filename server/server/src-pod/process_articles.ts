import { Request, Response, Express } from 'express';
import { app, authCheck } from '../server.js';
import { Request as JWTRequest } from 'express-jwt';
import { convertToTXT } from './pass_convert.js';
import { uploadFileToS3 } from './pass_files.js';
import { v4 as uuidv4 } from 'uuid';
import { upload, STORAGE_PATH } from './server-pod.js';
import { getMongoDataById, updateMongoData, createMongoData, updateMongoArrayDoc } from '../src-db/handle_mongo.js';
import { ObjectId } from 'mongodb';


export const processArticles = () => {

  // upload file to s3
  app.post('/pod/file/upload', upload.single('file'), async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    console.log('Received file:', req.file);
    if (!req.file || !req.body._id) {
      return res.status(400).json({ message: 'No file uploaded or no user id' });
    }
    let file = req.file;
    let originalMimetype = file.mimetype;
    let originalSize = file.size;

    if(file.mimetype != 'text/plain'){
      file = await convertToTXT(req.file, `${STORAGE_PATH}`);
      if (!file) {
        return res.status(500).json({ message: 'Failed to convert file, try again' });
      }
    }

    // upload to s3
    let articleId = new ObjectId();
    let articleKey = `articles/${articleId.toString()}.txt`;
    let uploadDetails = {
      Bucket: 'main-server',
      Key: articleKey,
      Body: file.buffer,
      ContentType: originalMimetype
    }
    const uploadResponse = await uploadFileToS3(uploadDetails);
    if (uploadResponse.statusCode === 200) {
      try{
        let articleData = {
            _id: articleId,
            key: articleKey,
            type: originalMimetype,
            size: originalSize,
            uploadedAt: new Date(),
            uploadedBy: new ObjectId(req.body._id)
        }
        let articleResult = await createMongoData('articles', articleData);
        await updateMongoArrayDoc('users', req.body._id, "articles",  articleId);

      res.status(200).json({
        message: 'File uploaded successfully',
        fileKey: uploadDetails.Key
      });
    } catch(e) {
      console.error(e);
      res.status(500).json({message: "Internal Error relating to uploading and updating user data", error: e})
    }
    } else {
      res.status(uploadResponse.statusCode).json({
        message: uploadResponse.message,
        error: uploadResponse.error
      });
    }
  });

}