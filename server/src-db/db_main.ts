import { Request, Response } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { router as recordRouter } from "./routes/records.js";
import { app, authCheck, weakAuthCheck } from "../server.js";
import { mongo_startup } from "./mongo_interface.js";
import { getAudioURLFromS3 } from './aws.js';
import { deleteMongoDocument, doesIdExist, doesSubExist, getMongoDataById } from './mongo_methods.js';
import { ObjectId } from 'mongodb';
import { deleteUserFromAuth0 } from './auth0_manager.js';
import { createUser } from './manage_user.js';


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
            
            let id = new ObjectId(req.query.id as string);
            const collection = req.query.collection as string;

            // Validate inputs
            if (!id || !collection) {
                return res.status(400).json({ 
                    error: 'Missing required parameters: id and collection' 
                });
            }

            const exists = await doesIdExist(collection, new ObjectId(id), req.envMode);
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
            const exists = await doesSubExist(collection, sub, req.envMode);
            res.json({ 'exists': exists });
        } catch (error) {
            console.error('Error checking sub existence:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/db/delete_user', authCheck, async (req: JWTRequest, res: Response) => {
        let id = new ObjectId(req.body.id as string);
        const sub = req.body.sub;
        console.log("Attempting to delete user with id:", id, "and sub:", sub);
        let mongo_response = await deleteMongoDocument("users", id, req.envMode);
        console.log("Mongo response:", mongo_response);
        let auth0_response = await deleteUserFromAuth0(sub as string);
        console.log("Auth0 response:", auth0_response);
        res.json({ 'success': true, 'mongo_response': mongo_response, 'auth0_response': auth0_response });
    });

    app.post('/db/create_user', authCheck, async (req: JWTRequest, res: Response) => {
        let mode = req.envMode;
        const user = req.body.user;
        const response = await createUser(user, mode);
        res.json({ 'success': true, 'response': response });
    });

    // Apply authentication to /db/records route
    app.use("/db/records", authCheck, recordRouter);
    // weak auth check to get audio
    app.use("/db/get_audio", weakAuthCheck, getAudio);
    // weak auth check to get podcast
    app.use("/db/get_podcast", weakAuthCheck, getPodcast);
    // Catch-all route for /db should be last
    app.use('/db', authCheck, (req: JWTRequest, res: Response) => {
        res.send(`DB Server: You accessed ${req.method} ${req.path}`);
    });
    return new Promise((resolve, reject) => {
        resolve(true);
    });
}

async function getAudio(req: JWTRequest, res: Response) {
    let audio_key = req.query.audio_key as string;
    if (audio_key == null || audio_key == undefined || audio_key == "") {
        audio_key = req.body.audio_key as string;
    }
    if (audio_key == null || audio_key == undefined || audio_key == "") {
        res.status(400).send("No audio key provided");
        return;
    }
    const audio_data = await getAudioURLFromS3(audio_key);
    res.send(audio_data);
}

async function getPodcast(req: JWTRequest, res: Response) {
    let podcast_id = req.query.podcast_id as string;
    if (podcast_id == null || podcast_id == undefined || podcast_id == "") {
        podcast_id = req.body.podcast_id as string;
    }
    if (podcast_id == null || podcast_id == undefined || podcast_id == "") {
        res.status(400).send("No podcast id provided");
        return;
    }
    const podcast_data = await getMongoDataById("pods", new ObjectId(podcast_id), req.envMode);
    res.send(podcast_data);
}