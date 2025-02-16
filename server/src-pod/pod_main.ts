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
import { Music_Choice } from './process_track.js';


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

let current_pod_creators: string[] = [];

async function triggerPodCreation(req: JWTRequest, res: Response) {
  // Validate request
  let start_time = Date.now();
  if (!req.file || !req.body.user_id || !req.body.new_pod_id) {
    return res.status(400).json({
      message: 'Missing required fields',
      details: {
        file: req.file || null,
        user_id: req.body.user_id || null,
        new_pod_id: req.body.new_pod_id || null
      }
    });
  }
  console.log('triggerPodCreation by user: ' + req.body.user_id)
  console.log('current_pod_creators: ' + current_pod_creators)
  if(current_pod_creators.includes(req.body.user_id as string)) {
    console.log('user already has a pod in progress')
    return res.status(400).json({
      message: 'User already has a pod in progress'
    });
  }
  
  current_pod_creators.push(req.body.user_id as string);
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
  if (await doesIdExist('pods', new_pod_id, req.envMode)) {
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

    // Process and upload article
    let articlePath: string;
    let articleId: string;
    try {
      const articleProcessResponse = await processArticles(req.file);
      articlePath = articleProcessResponse.file_path;
      articleId = articleProcessResponse.article_id;
      let articleMessage: ProcessingStep = {
        step: "article",
        status: ProcessingStatus.IN_PROGRESS,
        file_path: articlePath,
        article_id: articleId
      }
      sendUpdate(new_pod_id, articleMessage);
    } catch (error) {
      return onPodError(newPod, user_id, {
        status: ProcessingStatus.ERROR,
        step: "article",
        message: `Article processing failed: ${error.message}`
      }, res, req);
    }

    // Create screenplay
    let scriptData: Script;
    let theme: Music_Choice;
    try {
      const scriptResponse = await createScript(articlePath, articleId, newPod, user_id, req.envMode);
      if (scriptResponse.status === ProcessingStatus.ERROR) {
        return onPodError(newPod, user_id, {
          status: ProcessingStatus.ERROR,
          step: "script",
          message: `Script creation failed: ${scriptResponse.message}`,
          theme: scriptResponse.theme
        }, res, req);
      }
      console.log('scriptResponse.message: ' + scriptResponse.message)
      scriptData = scriptResponse.script;
      theme = scriptResponse.theme;
    } catch (error) {
      return onPodError(newPod, user_id, {
        status: ProcessingStatus.ERROR,
        step: "script",
        message: `Script creation failed: ${error.message}`
      }, res, req);
    }

    // Create podcast
    const podResponse = await createPodInParallel(scriptData, newPod._id.toString(), res, req.envMode, theme);
    if (podResponse.status === ProcessingStatus.ERROR) {
      return onPodError(newPod, user_id, {
        status: ProcessingStatus.ERROR,
        step: "pod",
        message: `Pod creation failed: ${podResponse.message}`
      }, res, req);
    }
    sendUpdate(new_pod_id, podResponse);
    try {
    // Cleanup - Save to S3
    if (articlePath) {
      await uploadArticleToS3(articleId, articlePath, req.body.user_id);
      newPod.article_key = `articles/${articleId}.txt`;
      await uploadCleanedArticleToS3(articleId, `${STORAGE_PATH}/clean-${articleId}.txt`, req.body.user_id);
      newPod.clean_article_key = `cleaned_articles/${articleId}.txt`;
    }
    if (scriptData) {
      let local_path = path.join(TEMP_DATA_PATH, 'scripts', scriptData.filename);
      await uploadScriptToS3(scriptData.filename, local_path, req.body.user_id);
      newPod.script_key = `scripts/${scriptData.filename}`;
    }
    newPod.status = PodStatus.READY;
    if (podResponse.filename) {
      newPod.audio_key = `pod-audio/${podResponse.filename}`;
    }
    await updateMongoData('pods', newPod, req.envMode);

    sendUpdate(new_pod_id, {
      status: ProcessingStatus.COMPLETED,
      step: "powerdown"
    });
    sendOneSignalNotification({
      externalUserId: user_id.toString(),
      message: 'Your podcast is ready!',
      title: 'Podcast Ready',
    });
    current_pod_creators = current_pod_creators.filter(id => id.toString() !== user_id.toString());
    console.log("finished with pod creation for pod: " + new_pod_id.toString())
    console.log("time taken: " + (Date.now() - start_time) / 1000 + " seconds")
    res.end();
  } catch (error) {
    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      onPodError(newPod, user_id, {
        status: ProcessingStatus.ERROR,
        step: "cleanup",
        message: "Internal server error",
        error: error.message
      }, res, req);
    } else {
      onPodError(newPod, user_id, {
        status: ProcessingStatus.ERROR,
        step: "cleanup",
        message: error.message
      }, res, req);
    }
  }
}


function onPodError(pod: Partial<Pod>, user_id: ObjectId, message: ProcessingStep, res: Response, req: Request) {
  pod.status = PodStatus.ERROR;
  console.log('Reach onPodError')
  console.log(message)
  if (pod.created_at != undefined) {
    updateMongoData('pods', pod, req.envMode);
    updateMongoArrayDoc('users', user_id, 'pods', pod._id, req.envMode);
    current_pod_creators = current_pod_creators.filter(id => id.toString() !== user_id.toString());
  }
  sendUpdate(pod._id, message);
  res.end();
}
