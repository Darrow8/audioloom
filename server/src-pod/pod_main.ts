import { Request, Response, Express } from 'express';
import { app, authCheck } from '../server.js';
import { Request as JWTRequest } from 'express-jwt';
import multer from 'multer';
import path from 'path';
import { processArticles } from './process_articles.js';
import { startup } from './init.js';
import { createPodcast, createPodcastInParallel } from './process_pod.js';
const supportedTypes = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt'
};

export const STORAGE_PATH = 'uploads';

export function sum(a: number, b: number) {
  return a + b;
}

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

  app.get('/pod/gen', async (req: Request, res: Response) => {
    console.log('creating podcast')
    const scriptName = req.query.scriptName as string;
    if (!scriptName) {
      return res.status(400).send('Script name is required as a query parameter');
    }
    console.log(`Creating podcast for script: ${scriptName}`);
    let resp = await createPodcastInParallel(scriptName, res)
    res.send(resp);
  });

  processArticles();
  
  // stream();
  // Catch-all route for /pod should be last
  app.use('/pod', authCheck, (req: JWTRequest, res: Response) => {
    res.send(`Pod Server: You accessed ${req.method} ${req.path}`);
  });
  return new Promise((resolve, reject) => {
    resolve(true);
  });
}