import ffmpeg from 'fluent-ffmpeg';
import streamifier from 'streamifier';
import { PassThrough } from 'stream';

/**
 * spliceAudioStreams
 * splice audio streams together from an array
 */
export function spliceAudioStreams(audioStreams) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      const outputStream = new PassThrough();
  
      audioStreams.forEach((audioStream, index) => {
        command.input(streamifier.createReadStream(audioStream))
          .inputOptions(['-f mp3']); // assuming the input format is mp3, adjust if different
      });
  
      command
        .on('end', () => {
          console.log('Audio splicing finished!');
          outputStream.end();
        })
        .on('error', (err) => {
          console.error('Error while splicing audio:', err);
          outputStream.destroy(err);
          reject(err);
        })
        .output(outputStream)
        .outputFormat('mp3')
        .run();
  
      resolve(outputStream);
    });
  }

  /**
   * overlayAudioStreams
   * overlay 2 streams together
   */
export function overlayAudioStreams(baseAudioStream, overlayAudioStreams) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(streamifier.createReadStream(baseAudioStream))
        .inputOptions(['-f mp3']); // assuming the base input format is mp3, adjust if different
  
      overlayAudioStreams.forEach((overlayAudioStream) => {
        command.input(streamifier.createReadStream(overlayAudioStream))
          .inputOptions(['-f mp3']); // assuming the overlay input format is mp3, adjust if different
      });
  
      const outputStream = new PassThrough();
  
      command
        .complexFilter(overlayAudioStreams.map((_, index) => `[0:a][${index + 1}:a]amix=inputs=2:duration=longest`))
        .on('end', () => {
          console.log('Audio overlay finished!');
          outputStream.end();
        })
        .on('error', (err) => {
          console.error('Error while overlaying audio:', err);
          outputStream.destroy(err);
          reject(err);
        })
        .output(outputStream)
        .outputFormat('mp3')
        .run();
  
      resolve(outputStream);
    });
  }