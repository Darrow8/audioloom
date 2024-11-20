import { Request, Response, Express } from 'express';
import { app, authCheck, io } from '../server.js';
import { Request as JWTRequest } from 'express-jwt';
import multer from 'multer';
import path from 'path';
import { processArticles, uploadArticleToS3 } from './process_articles.js';
import { startup } from './init.js';
import { createPodInParallel } from './process_pod.js';
import { createScript, getInstructions, saveFileToS3, saveScriptToS3 } from './process_script.js';
import { ProcessingStep } from '@shared/processing.js';
import { ProcessingStatus } from '@shared/processing.js';
import { Pod } from '@shared/pods';
import { PodStatus } from '@shared/pods';
import { createMongoData, doesIdExist, updateMongoArrayDoc, updateMongoData } from '@/mongo_methods.js';
import { ObjectId } from 'bson';
import { Voices } from '@shared/voice';
import { RawPrompts, Script } from '@shared/script';
import { localInstructions } from './process_prompt.js';
import { getVoices } from './pass_voice.js';
import { saveClipToLogs } from './local.js';
export const STORAGE_PATH = 'uploads';

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
    fileSize: 50 * 1024 * 1024 // 50 MB
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
  app.get('/pod/test', authCheck, async (req: JWTRequest, res: Response) => {
    // Set proper headers for SSE
    console.log('test')
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    console.log('sending initial connection message')
    res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);

    // Keep connection alive
    const intervalId = setInterval(() => {
      console.log('sending heartbeat')
      res.write(`data: ${JSON.stringify({ status: 'heartbeat' })}\n\n`);
    }, 1000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(intervalId);
      console.log('client disconnected')
    });
  });

  app.post('/pod/trigger_creation', upload.single('file'), authCheck, async (req: JWTRequest, res: Response) => {
    if (!req.file) {
      console.error('No file received');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log('req.file: ' + req.file)

    if (req.file.size === 0) {
      return res.status(400).json({ error: 'File size is 0 bytes' });
    }
    await triggerPodCreation(req, res);
    console.log('im done...')
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


async function triggerPodCreation(req: JWTRequest, res: Response) {
  // Validate request
  if (!req.file || !req.body.user_id || !req.body.new_pod_id) {
    return res.status(400).json({
      message: 'Missing required fields',
      details: {
        file: !req.file ? 'Missing file' : null,
        user_id: !req.body.user_id ? 'Missing user_id' : null,
        new_pod_id: !req.body.new_pod_id ? 'Missing new_pod_id' : null
      }
    });
  }
  console.log('triggerPodCreation by user: ' + req.body.user_id)

  // Validate file type
  if (!supportedTypes[req.file.mimetype]) {
    return res.status(400).json({
      message: 'Unsupported file type',
      supported: Object.keys(supportedTypes)
    });
  }
  console.log('file size: ' + req.file.size);

  const new_pod_id = new ObjectId(req.body.new_pod_id as string);

  let initMessage: ProcessingStep = {
    step: "init",
    status: ProcessingStatus.IN_PROGRESS
  }
  sendUpdate(new_pod_id, initMessage);

  // Check if the pod already exists
  if (await doesIdExist('pods', new_pod_id)) {
    return res.status(400).json({ message: 'Pod already exists' });
  }

  const user_id = new ObjectId(req.body.user_id as string);

  let newPod: Partial<Pod> = {
    _id: new_pod_id,
    status: PodStatus.PENDING,
    title: "Initializing Pod",
    author: "init",
    audio_key: "init"
  }

  try {
    // Step 1: Process and upload article
    let articlePath: string;

    try {
      const articleProcessResponse = await processArticles(req.file);
      articlePath = articleProcessResponse.file_path;
      let articleMessage: ProcessingStep = {
        step: "article",
        status: ProcessingStatus.IN_PROGRESS,
        file_path: articlePath
      }
      sendUpdate(new_pod_id, articleMessage);
    } catch (error) {
      return onPodError(newPod, {
        status: ProcessingStatus.ERROR,
        step: "article",
        message: `Article processing failed: ${error.message}`
      }, res);
    }

    // Step 3: Create screenplay
    let scriptData: Script;
    try {
      const scriptResponse = await createScript(articlePath, newPod, user_id);
      if (scriptResponse.status === ProcessingStatus.ERROR) {
        return onPodError(newPod, scriptResponse, res);
      }
      console.log('scriptResponse.message: ' + scriptResponse.message)
      scriptData = scriptResponse.script;
    } catch (error) {
      return onPodError(newPod, {
        status: ProcessingStatus.ERROR,
        step: "script",
        message: `Script creation failed: ${error.message}`
      }, res);
    }

    // // Step 4: Create podcast
    const podResponse = await createPodInParallel(scriptData, newPod._id.toString(), res);
    if (podResponse.status === ProcessingStatus.ERROR) {
      return onPodError(newPod, podResponse, res);
    }
    sendUpdate(new_pod_id, podResponse);

    // Step 5: Cleanup - Save to S3 and delete local files
    try {
      if (articlePath) {
        await uploadArticleToS3(articlePath, req.body.user_id);
      }
      if (scriptData) {
        // scriptData = scriptData.replace('uploads/', '');
        // await saveFileToS3();
      }
      newPod.status = PodStatus.READY;
      if (podResponse.filename) {
        newPod.audio_key = `pod-audio/${podResponse.filename}`;
      }
      await updateMongoData('pods', newPod);
    } catch (error) {
      console.error('Cleanup error:', error);
      // Continue execution as this is not critical
    }
    sendUpdate(new_pod_id, {
      status: ProcessingStatus.COMPLETED,
      step: "powerdown"
    });
    res.end();
  } catch (error) {
    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      onPodError(newPod, {
        status: ProcessingStatus.ERROR,
        step: "cleanup",
        message: "Internal server error",
        error: error.message
      }, res);
    } else {
      onPodError(newPod, {
        status: ProcessingStatus.ERROR,
        step: "cleanup",
        message: error.message
      }, res);
    }
  }
}


function onPodError(pod: Partial<Pod>, message: ProcessingStep, res: Response) {
  pod.status = PodStatus.ERROR;
  console.log('Reach onPodError')
  console.log(message)
  if (pod.created_at != undefined) {
    updateMongoData('pods', pod);
    // TODO: remove this pod from the user's pods array
  }
  sendUpdate(pod._id, message);
  res.end();
}
