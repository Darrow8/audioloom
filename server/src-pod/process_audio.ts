import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

import { AudioFile, Clip, MusicLine, MusicType } from '@shared/line.js';
import { TEMP_DATA_PATH } from '@pod/init.js';
import path from 'path';


async function overlayAudios(backgroundFile: string, overlayFiles: Clip[], outputFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(TEMP_DATA_PATH, 'result', `${outputFile}.mp3`);
    const backgroundFilePath = path.join(TEMP_DATA_PATH, 'character', `${backgroundFile}.mp3`);

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
      const startMs = (file.audio.start * 1000); // Ensure non-negative
      const durationMs = (file.audio.duration * 1000);
      const fadeInDuration = Math.min(1000, durationMs / 3);
      const fadeOutDuration = Math.min(1000, durationMs / 3);
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
        `afade=t=in:st=0:d=${fadeInDuration / 1000},` +
        `afade=t=out:st=${fadeOutStart / 1000}:d=${fadeOutDuration / 1000},` +
        `adelay=${startMs}|${startMs}[aud${inputIndex}]`;
    });

    const mixInputs = overlayFiles.map((_, index) => `[aud${index + 1}]`).join('');
    filterComplex.push(`[0:a]volume=${backgroundVolumeLevel}dB[bg];${mixInputs}[bg]amix=inputs=${overlayFiles.length + 1}:duration=longest[aout]`);

    // Apply the complex filter
    command = command.complexFilter(filterComplex.join(';'), 'aout');

    // Output the mixed audio to the specified output file
    let totalTime = 0;
    command
      .on('start', (cmd) => {
        console.log(`Started: ${cmd}`);
        // Check if cmd.duration exists before trying to parse it
        if (cmd.duration) {
          totalTime = parseInt(cmd.duration.replace(/:/g, ''));
        } else {
          console.log('Duration not available, progress calculation may be inaccurate');
          totalTime = 0; // Set a default value or calculate based on input files
        }
      })
      .on('progress', (progress) => {
        if (totalTime > 0) {
          const time = parseInt(progress.timemark.replace(/:/g, ''));
          const percent = (time / totalTime) * 100;
          console.log(`Overlaying audio progress: ${percent.toFixed(2)}% done`);
        } else {
          console.log(`Processing... Current time: ${progress.timemark}`);
        }
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

export async function spliceAudioFiles(inputFiles: AudioFile[], outputFile: string, pathModule: string): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log('inputFiles', inputFiles);
      console.log('outputFile', outputFile);
      console.log('path', pathModule);

      // Ensure the output directory exists
      if (!fs.existsSync(pathModule)) {
        fs.mkdirSync(pathModule, { recursive: true });
      }

      // Use absolute paths for the input files
      const fileList = inputFiles.map(file => `file '${path.resolve(file.url)}'`).join('\n');
      const fileListPath = path.resolve(`${pathModule}/filelist.txt`);
      fs.writeFileSync(fileListPath, fileList);

      console.log('File list content:', fileList);
      console.log('File list path:', fileListPath);

      const outputFilePath = path.resolve(`${pathModule}/${outputFile}`);

      // Use ffmpeg with the file list
      ffmpeg()
        .input(fileListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions('-c', 'copy')
        .on('error', (err) => {
          console.error('Error: ' + err.message);
          fs.unlinkSync(fileListPath);
          reject(err);
        })
        .on('end', () => {
          console.log('Concatenation finished!');
          // Clean up the temporary file
          fs.unlinkSync(fileListPath);
          resolve();
        })
        .save(outputFilePath);

    } catch (err) {
      console.error('Error in spliceAudioFiles:', err);
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
 * Principles for adding in background music and sound effects to  
 */

/**
 * addInMusic takes just the file of character dialogue and adds in the audio
 * @param input initial file of audio dialogue
 * @param char_clips character clips of the current pod
 * @param music_clips music clips of the current pod
 */
export async function addInMusic(input: string, char_clips: Clip[], music_clips: Clip[], output: string) {
  // this for loop determines the start at stop times of each music file
  // music_clips.length
  for (let i = 0; i < music_clips.length; i++) {
    let startTime = 0;
    // for each music clip get the nearest char clip
    let nearest_char = nearestCharBefore(char_clips, music_clips[i]);
    console.log('nearest char ', nearest_char)
    if (nearest_char != undefined) {
      // if nearest char exists, then set startTime to the END of nearest char (end = start + duration)
      startTime = Math.round(nearest_char.audio.start * 100) / 100 + Math.round(nearest_char.audio.duration * 100) / 100;
      // add in a bit of variation (between -3 to 3)
      startTime += Math.floor(Math.random() * 7) - 3;
    }
    startTime = Math.round(startTime * 100) / 100;
    music_clips[i].audio.start = startTime;
  }

  // now determine stop times for all except last clip
  for (let i = 0; i < music_clips.length - 1; i++) {
    let cur_clip = music_clips[i];
    let next_clip = music_clips[i + 1];
    if (cur_clip.audio.rawDuration + cur_clip.audio.start > next_clip.audio.start) {
      let duration_diff = cur_clip.audio.rawDuration + cur_clip.audio.start - next_clip.audio.start;
      music_clips[i].audio.duration = music_clips[i].audio.rawDuration - duration_diff; // remove diff

    } else {
      music_clips[i].audio.duration = music_clips[i].audio.rawDuration;
    }
  }

  // limit last clip
  let last_music_clip = music_clips[music_clips.length - 1];
  let last_char_clip = char_clips[char_clips.length - 1];

  let music_total_time = last_music_clip.audio.rawDuration + last_music_clip.audio.start;
  let char_total_time = last_char_clip.audio.duration + last_char_clip.audio.start;
  // if music last 5 seconds longer than audio, clip it
  let time_permitable = 5; // 5 seconds longer is okay
  if (music_total_time > (time_permitable + char_total_time)) {
    let ending_diff = music_total_time - (time_permitable + char_total_time);
    music_clips[music_clips.length - 1].audio.duration = music_clips[music_clips.length - 1].audio.rawDuration - ending_diff
  } else {
    music_clips[music_clips.length - 1].audio.duration = music_clips[music_clips.length - 1].audio.rawDuration;
  }

  // if it is a sound effect, it cannot last more than 10 seconds
  music_clips = music_clips.map((clip) => {
    if ((clip.line as MusicLine).type === MusicType.SFX) {
      clip.audio.duration = Math.min(clip.audio.duration, 10);
    }

    // round all the durations to 2 decimal places
    clip.audio.duration = Math.round(clip.audio.duration * 100) / 100;
    return clip;
  });
  console.log(music_clips.map((clip) => { return { 'start': clip.audio.start, 'duration': clip.audio.duration } }))

  await overlayAudios(input, music_clips, output)
  return true;
}

/**
 * Find nearest character line directly before this one (if none after, defaults to last) 
 */
function nearestCharBefore(char_clips: Clip[], music_clip: Clip): Clip {
  // Iterate through the sorted array
  if (music_clip.line.order == 1) {
    return undefined;
  }
  let good_order = music_clip.line.order - 1;

  let good_clip = char_clips.find((clip) => clip.line.order == good_order);
  return good_clip;
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