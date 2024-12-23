import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AudioUrlTransporter } from "@shared/s3.js";
import dotenv from 'dotenv';
import { S3 } from 'aws-sdk';
import { scheduleJob, Job } from 'node-schedule';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { HeadObjectCommandInput } from '@aws-sdk/client-s3';
dotenv.config();
const s3 = new S3Client(
    { region: "us-west-1",
        credentials: {
            accessKeyId: process.env['AWS_ACCESS_KEY'],
            secretAccessKey: process.env['AWS_SECRET_KEY']
        }
 });

/**
 * Retrieve a file from an S3 bucket
 * @param {string} fileName - The key (path) of the file in the S3 bucket
 * @returns {Promise<Buffer>} - A promise that resolves to the file data
 */
export async function getAudioURLFromS3(fileName:string) : Promise<AudioUrlTransporter> {
  // Create a command to retrieve the object
  const command = new GetObjectCommand({
      Bucket: 'main-server',
      Key: fileName,
  });


  try {
      // Generate a signed URL that expires in 1 hour (3600 seconds)
      let expiresIn = 36000; // 100 hours
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: expiresIn });

      return {
        audio_key: fileName,
        audio_url: signedUrl,
        created_at: new Date(),
        expires_at: new Date(Date.now() + expiresIn * 1000)
      };
  } catch (err) {
      console.error("Error getting signed URL from S3:", err);
      throw err;
  }

};