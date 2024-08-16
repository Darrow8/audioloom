import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { ElevenLabsClient } from "elevenlabs";
import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import { Readable } from "stream";
// elevenlabs client
export let elevenlabsClient: ElevenLabsClient;
export let elevenlabsInitialized = false;

// aws s3 client
export let s3Client: S3Client;
export let s3Initialized = false;

// openai client
export let openaiClient: OpenAI;
export let openai_initialized = false;

// Whether or not we are going to load temporary data 
export let run_temp = true;

/**
 * Main startup function that initializes all API calls and gets secret keys
 */
export async function startup() {
    try {
        // secret must be retrieved first
        let secret = await initSecrets();
        passSecrets(secret);
        initS3();
        initElevenLabs();
        initOpenAI();
        if (run_temp) {
            console.log("Downloading example data to /tmp");
            await copyExampleDataToTmp();
        }
    }
    catch (e) {
        throw new Error(`Error on Startup: ${e}`);
    }
}

// ... existing code ...

/**
 * Downloads files from S3 bucket and stores them in /tmp directory
 */
export async function copyExampleDataToTmp() {
    const bucketName = 'main-server';
    const targetDir = '/tmp';
    // Create /tmp/temp-data directory if it doesn't exist
    const tempDataDir = path.join(targetDir, 'temp-data');
    if (!fs.existsSync(tempDataDir)) {
        fs.mkdirSync(tempDataDir, { recursive: true });
    }

    // List all objects in the bucket within the temp-data folder
    const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: 'temp-data/' });
    const listResponse = await s3Client.send(listCommand);
    console.log(`Listing objects in bucket ${bucketName} with prefix 'temp-data/':`);
    console.log(listResponse);

    // Download each object
    for (const object of listResponse.Contents || []) {
        if (object.Key) {
            // Skip the directory itself
            if (object.Key.endsWith('/')) {
                continue;
            }

            console.log(`Downloading object ${object.Key} from bucket ${bucketName} to ${tempDataDir}`);

            const getObjectCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: object.Key,
            });
            const getObjectResponse = await s3Client.send(getObjectCommand);

            if (getObjectResponse.Body instanceof Readable) {
                const relativePath = object.Key.replace('temp-data/', '');
                const targetPath = path.join(tempDataDir, relativePath);
                const fileDir = path.dirname(targetPath);

                // Create subdirectories if they don't exist
                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir, { recursive: true });
                }

                // Write the file
                const writeStream = fs.createWriteStream(targetPath);
                await new Promise((resolve, reject) => {
                    if (getObjectResponse.Body instanceof Readable) {
                        getObjectResponse.Body.pipe(writeStream)
                            .on('finish', resolve)
                            .on('error', reject);
                    } else {
                        reject(new Error('Response body is not a readable stream'));
                    }
                });
            }
        }
    }

    console.log(`Downloaded files from S3 bucket to ${targetDir}`);

}


export const initOpenAI = () => {
    openaiClient = new OpenAI({
        organization: "org-nd9Kz3AFMD7Wo3q05FTQMFAw",
        project: "proj_6RLSgyTB2eo5NjAfghsFU8df",
        apiKey: process.env.OPENAI_API_KEY,
    });
    openai_initialized = true;
}

export const initElevenLabs = () => {
    if (!elevenlabsInitialized) {
        elevenlabsClient = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY,
        });
        elevenlabsInitialized = true;
    }
}

export const initS3 = () => {
    if (!s3Initialized) {
        s3Client = new S3Client({
            region: "us-west-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY
            }
        });
        s3Initialized = true;
    }
};

/**
 * Initializes secrets from AWS Secrets Manager
 */
export async function initSecrets() {
    const secret_name = "dev-keys";
    const credentials = {
        accessKeyId: "AKIA36WXSAYKWJKZWQGX",
        secretAccessKey: "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",
    }

    const client = new SecretsManagerClient({
        region: "us-west-1",
        credentials: credentials,
    });

    let response;

    try {
        response = await client.send(
            new GetSecretValueCommand({
                SecretId: secret_name,
                VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
            })
        );
    } catch (error) {
        // For a list of exceptions thrown, see
        // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
        throw error;
    }

    const secret = response.SecretString;
    return secret;
}
/**
 * Gets secret from initSecrets() and passes to process.env
 */
export function passSecrets(secret) {
    if (secret) {
        try {
            const secretObj = JSON.parse(secret);
            if (typeof secretObj === 'object' && secretObj !== null) {
                for (let key in secretObj) {
                    if (secretObj.hasOwnProperty(key)) {
                        process.env[key] = secretObj[key];
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing secret:', error);
        }
    } else {
        console.error('No secrets found');
    }
}