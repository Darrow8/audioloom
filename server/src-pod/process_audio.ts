import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

import { AudioFile, Clip, MusicLine, MusicType } from '@shared/line.js';
import { TEMP_DATA_PATH } from '@pod/init.js';
import path from 'path';

// https://stackoverflow.com/questions/14968615/rounding-to-the-nearest-hundredth-of-a-decimal-in-javascript
export function round(num, places) {
  var multiplier = Math.pow(10, places);
  return Math.round(num * multiplier) / multiplier;
}


/**
 * Function to get the duration of an audio file.
 * 
 * @param {string} filePath - The path to the audio file.
 * @returns {Promise<number>} - A promise that resolves with the duration of the audio file in seconds.
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        // Reject the promise with an error if ffprobe fails
        reject(err);
      } else {
        // Resolve the promise with the duration of the audio file in seconds
        const duration = round(metadata.format.duration, 3);
        resolve(duration);
      }
    });
  });
}



/**
 * Simple function that adds start times to the character audio files 
 * if they are not already set
 */
export function checkStartTime(char_processed: AudioFile[]) {
  let runningStart = 0;
  for (let i = 0; i < char_processed.length; i++) {
    if (char_processed[i].start == -1) {
      char_processed[i].start = runningStart;
    }
    runningStart += Math.round(char_processed[i].duration * 100) / 100;
  }
  return char_processed;
}