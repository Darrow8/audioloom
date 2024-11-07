// import path from 'path';
// import express from 'express';
// import chokidar from 'chokidar';
// import fs from 'fs';
// import { TEMP_DATA_PATH } from './init';
// import { app } from '../server';

// const clipDirectory = `${TEMP_DATA_PATH}/results`;
// let playlist = [];

// export const stream = () => {

//     // Watch for new audio clips
//     const watcher = chokidar.watch(clipDirectory, {
//         ignored: /(^|[\/\\])\../, // Ignore dot files
//         persistent: true
//     });

//     watcher.on('add', (path) => {
//         console.log(`New audio clip detected: ${path}`);
//         playlist.push(path);
//     });

//     app.get('/pod/stream', (req, res) => {
//         res.setHeader('Content-Type', 'audio/mpeg');
//         res.setHeader('Transfer-Encoding', 'chunked');

//         let currentFile = 0;

//         function streamNextChunk() {
//             if (currentFile >= playlist.length) {
//                 // If we've streamed all files, wait for new ones
//                 setTimeout(streamNextChunk, 1000);
//                 return;
//             }

//             const readStream = fs.createReadStream(playlist[currentFile]);

//             readStream.on('data', (chunk) => {
//                 res.write(chunk);
//             });

//             readStream.on('end', () => {
//                 currentFile++;
//                 streamNextChunk();
//             });

//             readStream.on('error', (err) => {
//                 console.error('Error reading file:', err);
//                 currentFile++;
//                 streamNextChunk();
//             });
//         }

//         streamNextChunk();
//     });
// }