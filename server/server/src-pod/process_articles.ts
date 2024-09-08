import { Request, Response, Express } from 'express';
import { app, authCheck } from '../server.js';
import { Request as JWTRequest } from 'express-jwt';
import { convertToTXT } from './pass_convert.js';
import { uploadFileToS3 } from './pass_files.js';
import { v4 as uuidv4 } from 'uuid';
import { upload, STORAGE_PATH } from './server-pod.js';
export const processArticles = () => {

  // upload file to s3
  app.post('/pod/file/upload', upload.single('file'), async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    console.log('Received file:', req.file);
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    let file = req.file;
    if(file.mimetype != 'text/plain'){
      file = await convertToTXT(req.file, `${STORAGE_PATH}`);
      if (!file) {
        return res.status(500).json({ message: 'Failed to convert file, try again' });
      }
    }

    // upload to s3
    let uploadDetails = {
      Bucket: 'main-server',
      Key: `articles/${uuidv4()}.txt`,
      Body: file.buffer,
      ContentType: file.mimetype
    }
    const uploadResponse = await uploadFileToS3(uploadDetails);
    if (uploadResponse.statusCode === 200) {
      res.status(200).json({
        message: 'File uploaded successfully',
        fileKey: uploadDetails.Key
      });
    } else {
      res.status(uploadResponse.statusCode).json({
        message: uploadResponse.message,
        error: uploadResponse.error
      });
    }
  });

}