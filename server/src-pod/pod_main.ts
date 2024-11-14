import { Request, Response, Express } from 'express';
import { app, authCheck } from '../server.js';
import { Request as JWTRequest } from 'express-jwt';
import multer from 'multer';
import path from 'path';
import { processArticles, uploadArticleToS3 } from './process_articles.js';
import { startup } from './init.js';
import { createPodInParallel } from './process_pod.js';
import { createScript, saveScriptToS3 } from './process_script.js';
import { ObjectId } from 'mongodb';
import { ProcessingStep } from '../../shared/src/processing.js';
import { ProcessingStatus } from '../../shared/src/processing.js';
const supportedTypes = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt'
};
import { Pod as MongoPod } from '@shared/pods';
import { PodStatus } from '@shared/pods';
import { createMongoData, updateMongoArrayDoc, updateMongoData } from '@/mongo_methods.js';
import { SSEResponse } from './sse_resp.js';

export const STORAGE_PATH = 'uploads';

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
    // Set proper headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    console.log('sending initial connection message')
    res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);

    await triggerPodCreation(req, res);
    // Clean up on client disconnect
    req.on('close', () => {
      console.log('client disconnected')
    });
  });

  // Catch-all route for /pod should be last
  app.use('/pod', authCheck, (req: JWTRequest, res: Response) => {
    res.send(`Pod Server: You accessed ${req.method} ${req.path}`);
  });
  return new Promise((resolve, reject) => {
    resolve(true);
  });
}

async function triggerTest(req: JWTRequest, res: Response) {
  console.log('triggerTest')
  const sse = new SSEResponse(res);

  // Send multiple messages to test the stream
  sse.send({
    status: ProcessingStatus.IN_PROGRESS,
    step: "test1"
  });

  // Wait a second
  await new Promise(resolve => setTimeout(resolve, 1000));

  sse.send({
    status: ProcessingStatus.IN_PROGRESS,
    step: "test2"
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  sse.send({
    status: ProcessingStatus.COMPLETED,
    step: "powerdown"
  });

  sse.end();
}


async function triggerPodCreation(req: JWTRequest, res: Response) {
  let newPod: MongoPod = {
    _id: new ObjectId(),
    status: PodStatus.PENDING,
    created_at: new Date(),
    title: "Test Pod",
    author: "test",
    audio_key: ""
  }
  try {
    console.log('triggering pod creation');

    // Validate request
    if (!req.file || !req.body._id) {
      return res.status(400).json({ message: 'No file uploaded or no user id' });
    }

    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Step 0: Initialize
    await createMongoData('pods', newPod);
    await updateMongoArrayDoc('users', req.body._id, 'pods', newPod._id);

    let initMessage: ProcessingStep = {
      step: "init",
      status: ProcessingStatus.IN_PROGRESS
    }
    res.write(JSON.stringify(initMessage));

    // Step 1: Process and upload article
    let articlePath: string;

    try {
      const articleProcessResponse = await processArticles(req.file, req.body._id);
      articlePath = articleProcessResponse.file_path;
      let articleMessage: ProcessingStep = {
        step: "article",
        status: ProcessingStatus.IN_PROGRESS,
        file_path: articlePath
      }
      res.write(JSON.stringify(articleMessage));
    } catch (error) {
      return onPodError(newPod, {
        status: ProcessingStatus.ERROR,
        step: "article",
        message: `Article processing failed: ${error.message}`
      }, res);
    }

    // Step 2: Create screenplay
    let scriptPath: string;
    try {
      const scriptResponse = await createScript(articlePath);
      if (scriptResponse.status === ProcessingStatus.ERROR) {
        return onPodError(newPod, scriptResponse, res);
      }
      scriptPath = scriptResponse.message;
    } catch (error) {
      return onPodError(newPod, {
        status: ProcessingStatus.ERROR,
        step: "script",
        message: `Script creation failed: ${error.message}`
      }, res);
    }

    // Step 3: Create podcast
    const podResponse = await createPodInParallel(scriptPath, newPod._id.toString(), res);
    if (podResponse.status === ProcessingStatus.ERROR) {
      return onPodError(newPod, podResponse, res);
    }
    res.write(JSON.stringify(podResponse));

    // Step 4: Cleanup - Save to S3 and delete local files
    try {
      if (articlePath) {
        await uploadArticleToS3(articlePath, req.body._id);
      }
      if (scriptPath) {
        await saveScriptToS3(scriptPath);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      // Continue execution as this is not critical
    }
    res.write(JSON.stringify({
      status: ProcessingStatus.COMPLETED,
      step: "powerdown"
    }));
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
    res.end();
  }
}


function onPodError(pod: MongoPod, message: ProcessingStep, res: Response) {
  pod.status = PodStatus.ERROR;
  updateMongoData('pods', pod);
  res.write(JSON.stringify(message));
  res.end();
}
