import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { ElevenLabsClient } from "elevenlabs";
import OpenAI from "openai";
import ffmpeg from 'fluent-ffmpeg';
import { ensureRequiredFolders } from '@pod/local.js';
import dotenv from 'dotenv';

dotenv.config();

// elevenlabs client
export let elevenlabsClient: ElevenLabsClient;
export let elevenlabsInitialized = false;

// aws s3 client
export let s3Client: S3Client;
export let s3Initialized = false;

// openai client
export let openaiClient: OpenAI;
export let openai_initialized = false;

export let TEMP_DATA_PATH = '';
export let STORAGE_PATH = '';

/**
 * Main startup function that initializes all API calls and gets secret keys
 */
export async function startup() {
    try {
        // secret must be retrieved first
        initS3();
        console.log("S3 initialized:", s3Initialized);
        
        initElevenLabs();
        console.log("ElevenLabs initialized:", elevenlabsInitialized);
        
        const openAIInitialized = initOpenAI();
        console.log("OpenAI initialized:", openAIInitialized);
        
        if(process.env.IS_DOCKER == "true") {
            TEMP_DATA_PATH = '/app/data';
            STORAGE_PATH = '/app/data/uploads';
            ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
            ffmpeg.setFfprobePath('/usr/bin/ffprobe');
        } else {
            // this is for my local machine
            ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg');
            ffmpeg.setFfprobePath('/opt/homebrew/bin/ffprobe');
            TEMP_DATA_PATH = './temp-data';
            STORAGE_PATH = './temp-data/uploads';
        }

        console.log("TEMP_DATA_PATH:", TEMP_DATA_PATH);
        console.log("STORAGE_PATH:", STORAGE_PATH);

        ensureRequiredFolders();
        console.log("Required folders ensured");
        
        if (!s3Initialized || !elevenlabsInitialized || !openAIInitialized) {
            throw new Error("One or more initializations failed");
        }
    }
    catch (e) {
        throw new Error(`Error on Startup: ${e}`);
    }
}

export const initOpenAI = () => {
    openaiClient = new OpenAI({
        organization: process.env.OPENAI_ORG_KEY,
        project: process.env.OPENAI_PROJECT_KEY,
        apiKey: process.env.OPENAI_API_KEY,
    });
    openai_initialized = true;
    return openai_initialized;
}

export const initElevenLabs = () => {
    if (!elevenlabsInitialized) {
        elevenlabsClient = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY,
        });
        elevenlabsInitialized = true;
    }
    return elevenlabsInitialized;
}

export const initS3 = () => {
    if (!s3Initialized) {
        try {
            s3Client = new S3Client({
                region: "us-west-1",
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY,
                    secretAccessKey: process.env.AWS_SECRET_KEY
                }
            });
            s3Initialized = true;
            return true;
        } catch (error) {
            console.error("Failed to initialize S3:", error);
            return false;
        }
    }
    return true;
};
