
import { PassThrough, Readable, pipeline } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import * as dotenv from 'dotenv';
dotenv.config();


const pipelineAsync = promisify(pipeline);
// ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);


/**
 * Overlays one audio file on top of another at a specified start time.
 * 
 * @param {string} backgroundFile - The background audio file path.
 * @param {string} overlayFile - The overlay audio file path.
 * @param {string} outputFile - The output file path where the mixed audio will be saved.
 * @param {number} overlayStartTime - The time (in seconds) at which the overlay audio should start.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * 
 * @example
 * overlayAudioFiles('background.mp3', 'overlay.mp3', 'output.mp3', 10)
 *   .then(() => console.log('Audio files overlayed successfully'))
 *   .catch(err => console.error('Error overlaying audio files:', err));
 */
export async function overlayAudioFiles(backgroundFile: string, overlayFile: string, outputFile: string, overlayStartTime: number): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(backgroundFile)
      .input(overlayFile)
      .inputOptions(['-itsoffset', overlayStartTime.toString()]) // Set the offset for the overlay file
      .complexFilter([
        '[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=3[a]'
      ], ['a'])
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        reject(err);
      })
      .output(outputFile)
      .run();
  });
}


/**
 * Splices together multiple audio files into one output file sequentially.
 * 
 * @param {string[]} inputFiles - An array of input file paths to be spliced together.
 * @param {string} outputFile - The output file path where the spliced audio will be saved.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * 
 * @example
 * spliceAudioFiles(['input1.mp3', 'input2.mp3'], 'output.mp3')
 *   .then(() => console.log('Audio files spliced successfully'))
 *   .catch(err => console.error('Error splicing audio files:', err));
 */
export async function spliceAudioFiles(inputFiles, outputFile, path) {
  return new Promise<void>(async (resolve, reject) => {
        // Create a file list for the concat filter
        
    try {
      // let writer = fs.createWriteStream(`${path}/${outputFile}`);
      const ffmpegCommand = ffmpeg();

      inputFiles.forEach(async file => {
        // let dur = await getAudioDuration(file)
        ffmpegCommand.addInput(file);
      });

      ffmpegCommand
      .mergeToFile(`${path}/${outputFile}`, './temp')
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        })

    } catch (err) {
      reject(err);
    }
  });
}



/**
 * Saves a Readable stream to a file.
 * 
 * @param {Readable} inputStream - The Readable stream to be saved.
 * @param {string} outputFile - The file path where the stream should be saved.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * 
 * @example
 * const readableStream = someReadableStreamFunction();
 * saveStreamToFile(readableStream, 'output.txt')
 *   .then(() => console.log('Stream saved successfully'))
 *   .catch(err => console.error('Error saving stream:', err));
 */
export async function saveStreamToFile(inputStream, outputFile) {
  return new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputFile);

    pipeline(inputStream, writeStream, (err) => {
      if (err) {
        console.log(err);
        reject();
      } else {
        console.log('saved!', outputFile);
        resolve();
      }
    });
  });
}

/**
 * Function to get the duration of an audio file.
 * 
 * @param {string} filePath - The path to the audio file.
 * @returns {Promise<number>} - A promise that resolves with the duration of the audio file in seconds.
 */
export async function getAudioDuration(filePath) {
  return new Promise<number>((resolve, reject) => {
      // Use ffprobe to get metadata of the audio file
      ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
              // Reject the promise with an error if ffprobe fails
              reject(err);
          } else {
              // Resolve the promise with the duration of the audio file in seconds
              const duration = metadata.format.duration;
              resolve(duration);
          }
      });
  });
}