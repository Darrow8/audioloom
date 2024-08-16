
import { PassThrough, Readable, pipeline } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import * as dotenv from 'dotenv';
import { AudioFile, Clip, MusicLine, MusicType } from './utils_pod';
import { exec } from 'child_process';
import * as fse from 'fs-extra';

dotenv.config();
const execPromise = promisify(exec);

// TODO: prevent audio files from clipping over one another
async function overlayAudios(backgroundFile: string, overlayFiles: Clip[], outputFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const outputPath = `./content/result/${outputFile}.mp3`;
    const backgroundFilePath = `./content/character/${backgroundFile}.mp3`;
    
    // Check if the input files exist
    if (!fs.existsSync(backgroundFilePath)) {
      return reject(new Error(`Main audio file not found: ${backgroundFilePath}`));
    }

    overlayFiles.forEach((file) => {
      if (!fs.existsSync(file.audio.url)) {
        console.log(new Error(`Overlay audio file not found: ${file.audio.url}`));
      }
    });

    // Start the ffmpeg command with the main audio file
    let command = ffmpeg(backgroundFilePath);
    const backgroundVolumeLevel = 20;

    // Add each overlay audio file as an input
    overlayFiles.forEach((file) => {
      command = command.input(file.audio.url);
    });

    // Prepare the complex filter
    const filterComplex = overlayFiles.map((file, index) => {
      const inputIndex = index + 1; // Since background file is [0]
      const startMs = Math.round(file.audio.start * 1000);
      const durationMs = Math.round(file.audio.duration * 1000);
      const fadeInDuration = Math.min(1000, durationMs / 2);
      const fadeOutDuration = Math.min(1000, durationMs / 2);
      const fadeOutStart = durationMs - fadeOutDuration;

      let musicVolume = 0;
      const aud_type = (file.line as MusicLine).type;
      if (aud_type === MusicType.BMusic) {
        musicVolume = backgroundVolumeLevel * 0.7;
      } else if (aud_type === MusicType.SFX) {
        musicVolume = backgroundVolumeLevel * 0.6;
      } else {
        throw new Error("Type undefined for music clip");
      }

      return `[${inputIndex}:a]atrim=duration=${file.audio.duration},asetpts=PTS-STARTPTS,` +
        `volume=${musicVolume}dB,` +
        `afade=t=in:st=0:d=${fadeInDuration / 1000},` + // afade expects seconds
        `afade=t=out:st=${fadeOutStart / 1000}:d=${fadeOutDuration / 1000},` + // afade expects seconds
        `adelay=${startMs}|${startMs}[aud${inputIndex}]`;
    });

    const mixInputs = overlayFiles.map((_, index) => `[aud${index + 1}]`).join('');
    filterComplex.push(`[0:a]volume=${backgroundVolumeLevel}dB[bg];${mixInputs}[bg]amix=inputs=${overlayFiles.length + 1}:duration=longest[aout]`);

    // Apply the complex filter
    command = command.complexFilter(filterComplex.join(';'), 'aout');

    // Output the mixed audio to the specified output file
    command
      .on('start', (cmd) => {
        console.log(`Started: ${cmd}`);
      })
      .on('progress', (progress) => {
        console.log(`Overlaying audio progress: ${progress.percent}% done`);
      })
      .on('end', () => {
        console.log('Finished processing');
        resolve();
      })
      .on('error', (err, stdout, stderr) => {
        console.error('Error:', err);
        console.error('FFmpeg stdout:', stdout);
        console.error('FFmpeg stderr:', stderr);
        reject(err);
      })
      .audioCodec('libmp3lame')
      .output(outputPath)
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

export async function spliceAudioFiles(inputFiles: AudioFile[], outputFile: string, path: string): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    // Create a file list for the concat filter
    try {
      const ffmpegCommand = ffmpeg();
      inputFiles.forEach(async file => {
        ffmpegCommand.addInput(file.url);
        // TODO: update with more advanced placement in the future
        file.start = round(determineStartTime(file, inputFiles), 3);
      });

      ffmpegCommand
        .mergeToFile(`${path}/${outputFile}`, `${path}-temp/`)
        .audioFilters(`volume=1.5`) // increase volume to 1.5 
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

// https://stackoverflow.com/questions/14968615/rounding-to-the-nearest-hundredth-of-a-decimal-in-javascript
export function round(num, places) {
  var multiplier = Math.pow(10, places);
  return Math.round(num * multiplier) / multiplier;
}

function determineStartTime(file: AudioFile, inputFiles: AudioFile[]) {
  let index = inputFiles.indexOf(file);
  let sum = 0;
  for (let i = 0; i < index; i++) {
    sum += inputFiles[i].duration;
  }
  return sum;
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
export async function saveStreamToFile(inputStream: Readable, outputFile: string): Promise<void> {
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
 * addInMusic takes just the file of character dialogue and adds in the audio
 * @param input initial file of audio dialogue
 * @param char_clips character clips of the current pod
 * @param music_clips music clips of the current pod
 */
export async function addInMusic(input: string, char_clips: Clip[], music_clips: Clip[], output:string) {

  for (let i = 0; i < music_clips.length; i++) {
    // console.log('examining', music_clips[i]);
    let startTime = 10;
    // for each music clip get the nearest char clip
    let nearest_char = nearestAfterChar(char_clips, music_clips[i]);
    // console.log('nearest char ', nearest_char.line.id)
    if (nearest_char != undefined) {
      startTime = nearest_char.audio.start;
    } else {
      // temp fix assuming 1:1 ratio of time and audio clips
      try {
        startTime = char_clips[i].audio.start;
      }
      catch (e) {
        console.log(e);
        // last ditch effort
        startTime = char_clips[i - 1].audio.duration + char_clips[i - 1].audio.start;
      }
    }
    startTime = Math.round(startTime);
    music_clips[i].audio.start = startTime;
  }
  // console.log(music_clips);

  await overlayAudios(input, music_clips, output)
    .catch((err) => { console.log(err) }).then(() => {
      console.log('completed')
    });


}

/**
 * Find nearest character line directly after this one (if none after, defaults to last) 
 */
function nearestAfterChar(char_clips: Clip[], music_clip: Clip): Clip {
  // Iterate through the sorted array
  for (let i = 0; i < char_clips.length; i++) {
    if (char_clips[i].line.order > music_clip.line.order) {
      return char_clips[i];
    }
  }

  return undefined;
}

function getVolume(file: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let volumeOutput = '';
    
    ffmpeg()
      .input(file)
      // .inputOptions('-t 60') // Analyze only the first 60 seconds to speed up the process
      .audioFilters('volumedetect')
      .noVideo()
      .outputOptions('-f null')
      .on('stderr', (stderrLine) => {
        volumeOutput += stderrLine + '\n';
      })
      .on('error', (err, stdout, stderr) => {
        // Check if we have the volume info despite the "error"
        const match = volumeOutput.match(/mean_volume: ([-\d.]+) dB/);
        if (match) {
          resolve(parseFloat(match[1]));
        } else {
          console.error('FFmpeg stderr:', stderr);
          reject(new Error('Could not detect volume'));
        }
      })
      .on('end', () => {
        const match = volumeOutput.match(/mean_volume: ([-\d.]+) dB/);
        if (match) {
          resolve(parseFloat(match[1]));
        } else {
          console.error('Volume data not found in FFmpeg output');
          reject(new Error('Could not detect volume'));
        }
      })
      .output('/dev/null')
      .run();
  });
}

// async function normalizeLoudness(folderPath:string, file:string) {
//   try {
//       let fullFilePath = `${folderPath}/${file}`;
//       let tempFilePath = `${folderPath}-temp/${file}`;
//       await new Promise<void>((resolve, reject) => {
//           ffmpeg(fullFilePath)
//               .audioFilters('loudnorm')
//               .on('end', () => {
//                   resolve();
//               })
//               .on('error', (err) => {
//                   reject(`Error normalizing loudness: ${err.message}`);
//               })
//               .save(tempFilePath);
//       });

//       await fse.move(tempFilePath, fullFilePath, { overwrite: true });

//       console.log(`Normalization complete: ${fullFilePath}`);
//   } catch (err) {
//       console.error(err);
//   }
// }

// async function checkAndAdjustVolume(backgroundFile: string, overlayFile: string): Promise<number> {
//   try {
//     console.log("background file: ", backgroundFile)
//     console.log("overlay file: ", overlayFile)

//     const backgroundVolume = await getVolume(backgroundFile);
//     const overlayVolume = await getVolume(overlayFile);
//     console.log("background volume ", backgroundVolume);
//     console.log("overlay volume ", overlayVolume);


//     // If overlay is louder than background, calculate adjustment
//     if (overlayVolume > backgroundVolume) {
//       const adjustment = backgroundVolume - overlayVolume - 10; // -10 dB buffer
//       return Math.max(adjustment, -50); // Limit max reduction to -50 dB
//     }

//     await normalizeLoudness('./content/music',extractFileName(overlayFile));

//     return 0; // No adjustment needed
//   } catch (error) {
//     console.error('Error checking volume:', error);
//     return 0; // Return 0 if there's an error, assuming no adjustment
//   }
// }

function extractFileName(filePath:string) {
  const parts = filePath.split('/');
  return parts[parts.length - 1];
}