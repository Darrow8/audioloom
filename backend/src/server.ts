import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import { fileURLToPath } from 'url';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import bodyParser from 'body-parser';
import cors from 'cors';
import records from "./routes/record.js";
import * as jwt from 'express-jwt';
import * as jwksRsa from 'jwks-rsa';
import * as openai from './openai.js';
import * as epidemic from './epidemic.js';
import { Track, usefulTrack } from './epidemic_utils.js';
// import * as process_pod from './process_pod.js';




const app = express();
const port = process.env.PORT;
// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors());
app.use("/record", records);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


// test run
async function testMusicLoading(){
    let res = await openai.musicChooser("An intense patriotic Russian song slowly fading out",
        "[Serious] Welcome to Podcast Pro. I'm your host, Adam Page. Today, we're diving deep into a hidden world of strength, resilience, and protest. We're exploring the often misunderstood and overlooked anti-war movement in Russia. We'll uncover surprising stories of defiance, courage, and innovative resistance against an incredibly repressive regime. Joining me are correspondents Dan Storyev, Daria Korolenko, and Lauren McCarthy who have closely studied this movement from the ground up.")
    let music_choice = {};
    try {
        music_choice = JSON.parse(res);
    } catch (e) {
        throw `error parsing music chooser result ${res}`;
    }
    if('genre' in music_choice == false){
        music_choice['genre'] = "";
    }
    if('mood' in music_choice == false){
        music_choice['mood'] = "";
    }
    let tracks : usefulTrack[] = await epidemic.fetchTracks(music_choice['genre'],music_choice['mood'])
    let track = tracks[0];
    let outputPath = `./music/test.mp3`; // Replace with your desired local output file name
    let url = track.stems.full.lqMp3Url
    await epidemic.downloadFile(url, outputPath).catch((err) => {
        console.error(err);
    }).then(()=>{
        console.log("completed!")
    })
}
