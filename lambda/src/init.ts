import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { ElevenLabsClient } from "elevenlabs";
import OpenAI from "openai";

// elevenlabs client
export let elevenlabsClient: ElevenLabsClient;
export let elevenlabsInitialized = false;

// aws s3 client
export let s3Client: S3Client;
export let s3Initialized = false;

// openai client
export let openaiClient : OpenAI;
export let openai_initialized = false;

export async function startup() {
    try {
        // secret must be retrieved first
        let secret = await initSecrets();
        passSecrets(secret);
        initS3();
        initElevenLabs();
        initOpenAI();
    }
    catch (e) {
        throw new Error(`Error on Startup: ${e}`);
    }
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