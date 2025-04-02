import { Request, Response, Express } from 'express';
import { app, authCheck, io } from '../server.js';
import { Request as JWTRequest } from 'express-jwt';
import multer from 'multer';
import path from 'path';
import { processArticles, uploadArticleToS3, uploadScriptToS3, uploadCleanedArticleToS3 } from '@pod/process_articles.js';
import { startup, STORAGE_PATH, TEMP_DATA_PATH } from '@pod/init.js';
import { createPodInParallel } from '@pod/process_pod.js';
import { createScript } from '@pod/process_script.js';
import { ProcessingStep } from '@shared/processing.js';
import { ProcessingStatus } from '@shared/processing.js';
import { Pod } from '@shared/pods.js';
import { PodStatus } from '@shared/pods.js';
import { createMongoData, doesIdExist, updateMongoArrayDoc, updateMongoData } from '@db/mongo_methods.js';
import { ObjectId } from 'bson';
import { Voices } from '@shared/voice.js';
import { RawPrompts, Script } from '@shared/script.js';
import { localInstructions } from '@pod/process_prompt.js';
import { getVoices } from '@pod/pass_voice.js';
import { sendOneSignalNotification } from './sender.js';
import { Music_Choice } from './audio_chooser.js';
import { uploadAudioToS3 } from './s3_files.js';


export let base_voices: Voices;
export let base_instructions: RawPrompts;

const supportedTypes = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt'
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `${STORAGE_PATH}/`);
    },
    filename: (req, file, cb) => {
        const ext = supportedTypes[file.mimetype];
        cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
    }
});

// Multer upload configuration
export const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb: multer.FileFilterCallback) => {
        if (file.mimetype in supportedTypes) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Only PDF, DOCX, and TXT are allowed.'));
        }
    },
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB
    }
});

export async function podRoutes() {
    await startup();
    base_voices = await getVoices();
    base_instructions = await localInstructions();
    // Public route should be defined first
    app.get('/pod/public', (req: Request, res: Response) => {
        res.send('Hello from the /pod!');
    });

    // Pod route
    app.get('/pod', authCheck, (req: JWTRequest, res: Response) => {
        res.send('Hello from /pod!');
    });
    // app.get('/pod/test', authCheck, async (req: JWTRequest, res: Response) => {
    //     // Set proper headers for SSE
    //     console.log('test')
    //     res.setHeader('Content-Type', 'text/event-stream');
    //     res.setHeader('Cache-Control', 'no-cache');
    //     res.setHeader('Connection', 'keep-alive');
    //     res.setHeader('Access-Control-Allow-Origin', '*');

    //     // Send initial connection message
    //     console.log('sending initial connection message')
    //     res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);

    //     // Keep connection alive
    //     // const intervalId = setInterval(() => {
    //     //     console.log('sending heartbeat')
    //     //     res.write(`data: ${JSON.stringify({ status: 'heartbeat' })}\n\n`);
    //     // }, 1000);

    //     // Clean up on client disconnect
    //     // req.on('close', () => {
    //     //     clearInterval(intervalId);
    //     //     console.log('client disconnected')
    //     // });
    // });

    app.post('/pod/trigger_creation', upload.single('file'), authCheck, async (req: JWTRequest, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            if (req.file.size === 0) {
                return res.status(400).json({ error: 'File size is 0 bytes' });
            }
            await triggerPodCreation(req, res);
        } catch (error) {
            console.error('Error in /pod/trigger_creation:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Catch-all route for /pod should be last
    app.use('/pod', authCheck, (req: JWTRequest, res: Response) => {
        res.send(`Pod Server: You accessed ${req.method} ${req.path}`);
    });
    return new Promise((resolve, reject) => {
        resolve(true);
    });
}


export function sendUpdate(pod_id: ObjectId, update: ProcessingStep) {
    io.emit(`pod:${pod_id.toString()}:status`, update);
}

// global list of users who have a pod in progress
let current_pod_creators: string[] = [];

async function validateInput(req: JWTRequest, res: Response, new_pod_id: ObjectId): Promise<ProcessingStep> {
    try {
        if (!req.file || !req.body.user_id || !req.body.new_pod_id) {
            throw new Error('Missing required fields');
        }
        if (current_pod_creators.includes(req.body.user_id as string)) {
            throw new Error('User already has a pod in progress');
        }
        // Validate file type
        if (!supportedTypes[req.file.mimetype]) {
            throw new Error('Unsupported file type');
        }
        console.log('file size: ' + req.file.size);
        // Check if the pod already exists
        if (await doesIdExist('pods', new_pod_id, req.envMode)) {
            throw new Error('Pod already exists');
        }
        return {
            status: ProcessingStatus.SUCCESS,
            step: "input",
            message: 'Input validated'
        };
    } catch (error) {
        return {
            status: ProcessingStatus.ERROR,
            step: "input",
            message: error.message
        };
    }
}

/**
 * This function triggers the creation of a new pod.
 * It's only job is orchestrating the creation of a new pod and sending updates to the client.
 */
async function triggerPodCreation(req: JWTRequest, res: Response) {
    const new_pod_id = new ObjectId(req.body.new_pod_id as string);
    const user_id = new ObjectId(req.body.user_id as string);
    let newPod: Partial<Pod> = {
        _id: new_pod_id,
        status: PodStatus.PENDING,
        title: "Initializing Pod",
        author: "init",
        audio_key: "init",
        processing_time: -1
    }
    try {
        // Validate request
        let start_time = Date.now();
        // validate the input and check if the user has a pod in progress
        let initMessage: ProcessingStep = await validateInput(req, res, new_pod_id);
        current_pod_creators.push(req.body.user_id as string);

        if (initMessage.status === ProcessingStatus.ERROR) {
            console.log("caught error in validateInput")
            throw new Error(initMessage.message);
        }
        // Process and upload article
        const articleProcessResponse = await processArticles(req.file);
        let articlePath = articleProcessResponse.file_path;
        let articleId = articleProcessResponse.article_id;

        // Create screenplay
        const scriptResponse = await createScript(articlePath, articleId, newPod, user_id, req.envMode);
        if (scriptResponse.status === ProcessingStatus.ERROR) {
            throw new Error(`Script creation failed: ${scriptResponse.message}`);
        }
        console.log('scriptResponse.message: ' + scriptResponse.message)
        let scriptData: Script = scriptResponse.script;
        let theme: Music_Choice = scriptResponse.theme;
        let podResponse: ProcessingStep;
        // Create podcast
        if (process.env.SKIP_AUDIO_GENERATION == "false") {
            podResponse = await createPodInParallel(scriptData, newPod._id.toString(), res, req.envMode, theme);
            if (podResponse.status === ProcessingStatus.ERROR) {
                throw new Error(`Pod creation failed: ${podResponse.message}`);
            }
        }else{
            res.status(200).send('Script creation successful');
            return true;
        }
        // save to s3 and update mongo
        await saveCleanupPod(newPod, articlePath, new_pod_id, user_id, articleId, scriptData, podResponse, req, start_time);
        res.status(200).send('Pod creation successful');
        return true;
    } catch (error) {
        await onPodError(newPod, user_id, {
            status: ProcessingStatus.ERROR,
            step: "cleanup",
            message: "Internal server error",
            error: error.message
        }, req);
        res.status(500).send(error.message);
        return false;
    }
}

/**
 * Save and cleanup the pod
 */
async function saveCleanupPod(newPod: Partial<Pod>, articlePath: string, new_pod_id: ObjectId, user_id: ObjectId, articleId: string, scriptData: Script, podResponse: ProcessingStep, req: Request, start_time: number) {
    // skip audio generation if the SKIP_AUDIO_GENERATION environment variable is set
    if (process.env.SKIP_AUDIO_GENERATION == "false") {
        await uploadAudioToS3(`${newPod._id.toString()}.wav`);
        await updateMongoData('pods', {
            _id: new_pod_id,
            audio_key: `pod-audio/${newPod._id.toString()}.wav`,
            status: PodStatus.PENDING
        }, req.envMode);
    }
    
    // Cleanup - Save to S3
    if (articlePath) {
        await uploadArticleToS3(articleId, articlePath, user_id);
        newPod.article_key = `articles/${articleId}.txt`;
        await uploadCleanedArticleToS3(articleId, `${STORAGE_PATH}/clean-${articleId}.txt`, user_id);
        newPod.clean_article_key = `cleaned_articles/${articleId}.txt`;
    }
    if (scriptData) {
        let local_path = path.join(TEMP_DATA_PATH, 'scripts', scriptData.filename);
        await uploadScriptToS3(scriptData.filename, local_path, user_id);
        newPod.script_key = `scripts/${scriptData.filename}`;
    }
    newPod.status = PodStatus.READY;
    if (podResponse.filename) {
        newPod.audio_key = `pod-audio/${podResponse.filename}`;
    }
    if (process.env.SKIP_AUDIO_GENERATION == "false") {
        let time_taken = (Date.now() - start_time) / 1000;
        console.log("time taken: " + time_taken + " seconds")
        newPod.processing_time = time_taken;
        await updateMongoData('pods', newPod, req.envMode);

        sendOneSignalNotification({
            externalUserId: user_id.toString(),
            message: 'Your podcast is ready!',
            title: 'Podcast Ready',
        });
    }
    // remove the user from the list of current pod creators
    current_pod_creators = current_pod_creators.filter(id => id.toString() !== user_id.toString());
    console.log("finished with pod creation for pod: " + new_pod_id.toString())
    return true;
}


/**
 * If processing fails, update the pod status to error, ensure consistency, and send an error message to the client
 */
async function onPodError(pod: Partial<Pod>, user_id: ObjectId, message: ProcessingStep, req: Request) {
    pod.status = PodStatus.ERROR;
    current_pod_creators = current_pod_creators.filter(id => id.toString() !== user_id.toString());
    console.log("current_pod_creators: " + current_pod_creators)
    if (pod.created_at != undefined) {
        await updateMongoData('pods', pod, req.envMode);
        await updateMongoArrayDoc('users', user_id, 'pods', pod._id, req.envMode);

    }
    console.log("pod error: " + message.message)
    console.log('pod error finished')
    sendUpdate(pod._id, message);
}
