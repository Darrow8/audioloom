import express, { Request, Response, NextFunction } from 'express';
import type { Express } from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { expressjwt, GetVerificationKey, Request as JWTRequest } from 'express-jwt';
import jwks from 'jwks-rsa';
import { createPodcastInParallel } from './src-pod/process_pod.js';
// Import the route modules
import { podRoutes } from './src-pod/main.js';
import { dbRoutes } from './src-db/main.js';
import { routerFunctions } from './src-db/routes/records.js';

dotenv.config();

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const app: Express = express();

const PORT = parseInt(process.env.PORT || '3000');

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(helmet());
app.use(cors());

app.get('/public', (req: Request, res: Response) => {
    res.send('Hello from the main server!');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing server');
    // Close database connections here if needed
    process.exit(0);
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200 // limit each IP to 200 requests per windowMs
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
export const authCheck = (req: Request, res: Response, next: NextFunction) => {
    if(process.env.NODE_ENV == 'development'){
        return next();
    }

    jwtCheck(req, res, (jwtError) => {
        if (jwtError) {
            return next(jwtError);
        }
        apiKeyCheck(req, res, (apiKeyError) => {
            if (apiKeyError) {
                return next(apiKeyError);
            }
            next();
        });
    });
};
routerFunctions()
podRoutes();
dbRoutes();
// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
        console.log('Unauthorized access attempt');
        return res.status(401).json({ error: 'Unauthorized: Invalid token or API key', message: err.message });
    }
    console.log(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

