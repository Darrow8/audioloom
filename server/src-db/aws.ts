import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AudioUrlTransporter } from "@shared/s3";
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

// interface SizeChangeEvent {
//     previousSize: number;
//     currentSize: number;
//     timestamp: Date;
//     difference: number;
// }

// type SizeChangeListener = (event: SizeChangeEvent) => void;

// interface MonitorConfig {
//     fileKey: string;
//     intervalSeconds?: number;
//     region?: string;
// }

// export class S3WavMonitor {
//     private fileKey: string;
//     private intervalSeconds: number;
//     private lastSize: number | null;
//     private job: Job | null;
//     private listeners: SizeChangeListener[];

//     constructor(config: MonitorConfig) {
//         this.fileKey = config.fileKey;
//         this.intervalSeconds = config.intervalSeconds || 10;
//         this.lastSize = null;
//         this.job = null;
//         this.listeners = [];
//     }

//     private async getFileSize(): Promise<number | null> {
//         try {
//             const params: HeadObjectCommandInput = {
//                 Bucket: 'main-server',
//                 Key: this.fileKey
//             };

//             const command = new HeadObjectCommand(params);
//             const response = await s3.send(command);
            
//             return response.ContentLength ?? null;
//         } catch (error) {
//             if (error instanceof S3ServiceException) {
//                 if (error.name === 'NotFound') {
//                     return null;
//                 }
//             }
//             throw error;
//         }
//     }

//     private async checkForChanges(): Promise<void> {
//         try {
//             const currentSize = await this.getFileSize();
            
//             if (currentSize === null) {
//                 console.log('File not found');
//                 return;
//             }

//             if (this.lastSize !== null && currentSize !== this.lastSize) {
//                 const changeEvent: SizeChangeEvent = {
//                     previousSize: this.lastSize,
//                     currentSize,
//                     timestamp: new Date(),
//                     difference: currentSize - this.lastSize
//                 };

//                 this.listeners.forEach(listener => listener(changeEvent));
//             }

//             this.lastSize = currentSize;
//         } catch (error) {
//             console.error('Error checking file size:', error);
//         }
//     }

//     public onSizeChange(listener: SizeChangeListener): void {
//         this.listeners.push(listener);
//     }

//     public removeSizeChangeListener(listener: SizeChangeListener): void {
//         const index = this.listeners.indexOf(listener);
//         if (index > -1) {
//             this.listeners.splice(index, 1);
//         }
//     }

//     public start(): void {
//         if (this.job) {
//             console.warn('Monitor is already running');
//             return;
//         }

//         this.job = scheduleJob(`*/${this.intervalSeconds} * * * * *`, 
//             () => this.checkForChanges()
//         );

//         console.log(`Started monitoring ${this.fileKey}`);
//     }

//     public stop(): void {
//         if (this.job) {
//             this.job.cancel();
//             this.job = null;
//             console.log('Monitoring stopped');
//         }
//     }

//     public async destroy(): Promise<void> {
//         this.stop();
//         this.listeners = [];
//     }
// }