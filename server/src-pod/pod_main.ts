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
import { ProcessingStep } from './util_processing.js';
import { ProcessingStatus } from './util_processing.js';
const supportedTypes = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt'
};

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
    fileSize: 10 * 1024 * 1024 // 10 MB
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

  app.post('/pod/trigger_creation', upload.single('file'), authCheck, triggerPodCreation);

  // Catch-all route for /pod should be last
  app.use('/pod', authCheck, (req: JWTRequest, res: Response) => {
    res.send(`Pod Server: You accessed ${req.method} ${req.path}`);
  });
  return new Promise((resolve, reject) => {
    resolve(true);
  });
}

async function triggerPodCreation(req: JWTRequest, res: Response) {
  try {
    console.log('triggering pod creation');
    
    // Validate request
    if (!req.file || !req.body._id) {
      return res.status(400).json({ message: 'No file uploaded or no user id' });
    }

    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
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
      throw new Error(`Article processing failed: ${error.message}`);
    }

    // Step 2: Create screenplay
    let scriptPath: string;
    try {
      const scriptResponse = await createScript(articlePath);
      if (scriptResponse.status === ProcessingStatus.ERROR) {
        return res.status(500).json(scriptResponse);
      }
      scriptPath = scriptResponse.message;
    } catch (error) {
      throw new Error(`Script creation failed: ${error.message}`);
    }

    // Step 3: Create podcast
    const podResponse = await createPodInParallel(scriptPath, res);
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
      res.status(500).json({ 
        status: ProcessingStatus.ERROR,
        step: "cleanup",
        message: "Internal server error", 
        error: error.message 
      });
    } else {
      res.write(JSON.stringify({ 
        status: ProcessingStatus.ERROR, 
        step: "cleanup",
        message: error.message 
      }));
    }
    res.end();
  }
}
