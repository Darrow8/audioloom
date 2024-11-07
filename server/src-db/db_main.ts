import { Request, Response } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { router as recordRouter } from "./routes/records.js";
import { app, authCheck } from "../server.js";
import { mongo_startup } from "./mongo_interface.js";
import { getAudioURLFromS3, getFileFromS3 } from './aws.js';


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