import { Request, Response } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { router as recordRouter } from "./routes/records.js";
import { app, authCheck } from "../server.js";
import { mongo_startup } from "./mongo_interface.js";
import { getAudioURLFromS3 } from './aws.js';
import { doesIdExist, doesSubExist } from './mongo_methods.js';
import { ObjectId } from 'mongodb';


export async function dbRoutes() {
    mongo_startup();

    // Public route should be defined first
    app.get('/db/public', (req: Request, res: Response) => {
        res.send('Hello from the /db!');
    });

    // DB route
    app.get('/db', authCheck, (req: JWTRequest, res: Response) => {
        res.send('Hello from DB /db!');
    });

    // Example of a POST route
    app.post('/db', authCheck, (req: JWTRequest, res: Response) => {
        res.json({ message: 'Data received', data: req.body });
    });

    app.get('/db/id_exists', authCheck, async (req: JWTRequest, res: Response) => {
        try {
            // Use query parameters instead of body for GET request
            const id = req.query.id as string;
            const collection = req.query.collection as string;

            // Validate inputs
            if (!id || !collection) {
                return res.status(400).json({ 
                    error: 'Missing required parameters: id and collection' 
                });
            }

            const exists = await doesIdExist(collection, new ObjectId(id));
            res.json({ 'exists': exists });
        } catch (error) {
            console.error('Error checking ID existence:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/db/sub_exists', authCheck, async (req: JWTRequest, res: Response) => {
        try {
            // Use query parameters instead of body for GET request
            const sub = req.query.sub as string;
            const collection = req.query.collection as string;

            // Validate inputs
            if (!sub || !collection) {
                return res.status(400).json({ 
                    error: 'Missing required parameters: sub and collection' 
                });
            }
            const exists = await doesSubExist(collection, sub);
            res.json({ 'exists': exists });
        } catch (error) {
            console.error('Error checking sub existence:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Apply authentication to /db/records route
    app.use("/db/records", authCheck, recordRouter);

    app.use("/db/get_audio", authCheck, getAudio);

    // Catch-all route for /db should be last
    app.use('/db', authCheck, (req: JWTRequest, res: Response) => {
        res.send(`DB Server: You accessed ${req.method} ${req.path}`);
    });
    return new Promise((resolve, reject) => {
        resolve(true);
    });
}

async function getAudio(req: JWTRequest, res: Response) {
    const audio_key = req.body.audio_key;
    const audio_data = await getAudioURLFromS3(audio_key);
    res.send(audio_data);
}