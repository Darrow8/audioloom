import { parentPort, workerData } from 'worker_threads';
import { processLine } from './process_line.js';
import { Script } from '@shared/script.js';
import { Clip } from '@shared/line.js';
import { usefulTrack } from '@shared/music';

interface WorkerData {
    line: any;
    script: Script;
    characters: any;
    runningTime: number;
    theme_tracks: usefulTrack[];
}

async function processLineWorker() {
    if (!parentPort) {
        throw new Error('This module must be run as a worker thread');
    }

    const { line, script, characters, runningTime, theme_tracks }: WorkerData = workerData;
    
    try {
        const clip: Clip | null = await processLine(line, script, characters, runningTime, theme_tracks);
        parentPort.postMessage(clip);
    } catch (error) {
        throw error;
    }
}

processLineWorker().catch(error => {
    console.error('Worker error:', error);
    process.exit(1);
});