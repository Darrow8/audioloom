import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * normalizeAudioInPlace
 *
 * Normalize the volume of an audio file in place using the loudnorm filter.
 * This function creates a temporary file for the normalized audio,
 * then replaces the original file with the normalized one.
 *
 * @param inputPath - Path to the input audio file.
 * @returns Promise<void>
 */
export async function normalizeAudioInPlace(inputPath: string): Promise<void> {
    const extension = path.extname(inputPath).toLowerCase();
    const tempFilename = `${uuidv4()}-normalized${extension}`;
    const tempFilePath = path.join(path.dirname(inputPath), tempFilename);

    // Call the normalization function
    await normalizeAudio(inputPath, tempFilePath);

    // Replace the original file with the normalized one
    await fsPromises.unlink(inputPath);
    await fsPromises.rename(tempFilePath, inputPath);
}

/**
 * normalizeAudio
 *
 * Normalize the volume of an audio file using the loudnorm filter.
 *
 * @param inputPath - Path to the input audio file.
 * @param outputPath - Path to save the normalized audio file.
 * @returns Promise<void>
 */
export async function normalizeAudio(inputPath: string, outputPath: string): Promise<void> {
    // Determine the audio codec based on the file extension
    const extension = path.extname(outputPath).toLowerCase();
    let audioCodec = '';
    let outputFormat = '';

    if (extension === '.mp3') {
        audioCodec = 'libmp3lame';
        outputFormat = 'mp3';
    } else if (extension === '.wav') {
        audioCodec = 'pcm_s16le';
        outputFormat = 'wav';
    } else {
        throw new Error(`Unsupported audio format: ${extension}`);
    }

    return new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=summary',
                '-ar', '44100',    // Set the audio frequency to 44.1 kHz
                '-ac', '2',        // Set the number of audio channels to 2 (stereo)
                `-c:a`, audioCodec // Set the audio codec based on the file format
            ])
            .on('start', (cmd) => {
                console.log(`Started normalizing audio: ${cmd}`);
            })
            .on('end', () => {
                console.log('Finished normalizing audio');
                resolve();
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Error during normalization:', err.message);
                console.error('FFmpeg stderr:', stderr);
                reject(err);
            })
            // Ensure the correct output format is set
            .toFormat(outputFormat)
            .save(outputPath);
    });
}
