import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import https from 'https';
import fs from 'fs';
import { expressjwt, GetVerificationKey, Request as JWTRequest } from 'express-jwt';
import jwks from 'jwks-rsa';
import { fileURLToPath } from 'url';
import path from 'path';
import { router as recordRouter } from "./routes/records.js";
import * as handle_mongo from "./handle_mongo.js";

// Load environment variables
dotenv.config();

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(helmet());

// CORS configuration
// const corsOptions = {
//   origin: process.env.ALLOWED_ORIGIN || '*',
//   optionsSuccessStatus: 200
// };
app.use(cors());

// Connect to MongoDB

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Auth0 JWT validation middleware
const jwtCheck = expressjwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }) as GetVerificationKey,
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

// API key middleware
const apiKeyCheck = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');
  if (!apiKey || apiKey !== process.env.RIVET_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Combine JWT and API key checks
const authCheck = [jwtCheck, apiKeyCheck];

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.name, err.message);
  console.error('Request details:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

// Apply authentication to routes (now using both JWT and API key)
app.use("/records", authCheck, recordRouter);

// Secure root route (now using both JWT and API key)
app.get("/", authCheck, (req: JWTRequest, res: Response) => {
  res.json({ message: "Authenticated successfully", user: req.auth });
});

// Public route for testing
app.get("/public", (req: Request, res: Response) => {
  res.json({ message: "This is a public endpoint" });
});

// HTTPS configuration
let httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'cert.pem'))
};

// Create HTTPS server
const server = https.createServer(httpsOptions, app);


server.listen(port, () => {
    console.log('this is the latest version!')
    console.log(`Secure server is running on https://0.0.0.0:${port}`);
    handle_mongo.run()
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTPS server');
  server.close(() => {
    console.log('HTTPS server closed');
    // Close database connections here if needed
  });
});