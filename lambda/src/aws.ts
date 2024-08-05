import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import { Readable } from "stream";

dotenv.config();
const s3 = new S3Client({
  region: "us-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Retrieve a file from an S3 bucket
 * @param {string} fileName - The key (path) of the file in the S3 bucket
 * @returns {Promise<Buffer>} - A promise that resolves to the file data
 */
export async function getFileFromS3(fileName) : Promise<string> {
    // Create a command to retrieve the object
    const command = new GetObjectCommand({
        Bucket: 'main-server',
        Key: fileName,
    });

    try {
        // Send the command to S3
        const { Body } = await s3.send(command);

        // Convert the response stream to a string
        const streamToString = (stream) =>
        new Promise((resolve, reject) => {
            const chunks = [];
            stream.on("data", (chunk) => chunks.push(chunk));
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        });

        const fileContent = await streamToString(Body);

        return fileContent as string;
    } catch (err) {
        console.error("Error getting file from S3:", err);
        throw err;
    }
};


/**
 * Function to upload a file to an S3 bucket using the @aws-sdk/client-s3 package.
 * 
 * @param {Object} uploadDetails - The object containing file upload details.
 * @param {string} uploadDetails.bucketName - The name of the S3 bucket.
 * @param {string} uploadDetails.key - The key (file name) for the uploaded file.
 * @param {string|Buffer|Uint8Array|Blob} uploadDetails.body - The content of the file.
 * @param {string} uploadDetails.contentType - The MIME type of the file.
 * @returns {Object} Response object with status code and message.
 */
export async function uploadFileToS3(uploadDetails) {
    try {
      const { key, body, contentType } = uploadDetails;
  
      const params = {
        Bucket: 'main-server',
        Key: key,
        Body: body,
        ContentType: contentType,
      };
  
      const command = new PutObjectCommand(params);
      const data = await s3.send(command);
  
      // console.log('Successfully uploaded file:', data);
  
      return {
        statusCode: 200,
        message: 'File uploaded successfully',
        data: data
      };
    } catch (error) {
      console.error('Error uploading file:', error);
  
      return {
        statusCode: 500,
        message: 'Failed to upload file',
        error: error.message
      };
    }
  }