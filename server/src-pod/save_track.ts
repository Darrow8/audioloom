import fs from 'fs';
import { promises as fsPromises } from 'fs';

import { usefulTrack, Segment } from '@shared/music.js';
import { AudioFile } from '@shared/line.js';
import ffmpeg from 'fluent-ffmpeg';
import { getAudioDuration, round } from '@pod/process_audio.js';
import { TEMP_DATA_PATH } from '@pod/init.js';
import fetch from 'node-fetch';
import path from 'path';
import { response } from 'express';



export async function improvedSaveMusicAsAudio(tracks: usefulTrack[], id: string): Promise<AudioFile> {
    // Check for empty tracks array
    if (!tracks || tracks.length === 0) {
        throw new Error('No tracks provided');
    }

    // step 1: get random track in group
    let track = tracks[0]; //tracks[Math.floor(Math.random() * tracks.length)];
    let outputPath = path.join(TEMP_DATA_PATH, 'music', `${id}.mp3`);
    let url = track.stems.full.lqMp3Url;

    // Validate segment groups exist
    if (!track.segmentGroups?.[0]?.segments || track.segmentGroups[0].segments.length < 2) {
        throw new Error('Invalid segment groups structure');
    }

    // get random segment in group
    let segment_index = Math.round(Math.random() * (track.segmentGroups[0].segments.length - 1));
    console.log(`music: segment_index: ${segment_index}`);
    let segment_1 = track.segmentGroups[0].segments[segment_index];
    // let segment_2 = track.segmentGroups[0].segments[segment_index + 1];
    let duration_sum = Math.round(segment_1.duration);
    
    // step 2: download file
    let duration: number = await improvedDownloadFile(id, url, outputPath, segment_1.startTime, duration_sum);
    let overall_track_duration = Math.floor(track.durationMs / 1000);
    console.log(`music: current file duration: ${duration}`);
    console.log(`music: track duration: ${overall_track_duration}`);
    return new AudioFile(id, outputPath, duration, overall_track_duration);
}

export async function improvedDownloadFile(track_id: string, url: string, outputPath: string, startTime: number, duration: number): Promise<number> {
    let tempPath = path.join(TEMP_DATA_PATH, 'music', `${track_id}_raw.mp3`);
    console.log(`improvedDownloadFile: tempPath: ${tempPath}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const fileStream = fs.createWriteStream(tempPath);
        response.body.pipe(fileStream);

        // Wait for file write to complete
        await new Promise<void>((resolveStream, rejectStream) => {
            fileStream.on('finish', resolveStream);
            fileStream.on('error', rejectStream);
        });

        // Use ffmpeg to trim the file to specified duration
        await new Promise<void>((resolveFFmpeg, rejectFFmpeg) => {
            ffmpeg(tempPath)
                .setStartTime(startTime)
                .setDuration(duration)
                .audioFilters('volume=0.25')
                .output(outputPath)
                .on('end', () => {
                    console.log(`Audio processing in improvedDownloadFile completed: ${outputPath}`);
                    resolveFFmpeg();
                })
                .on('error', (err: Error) => {
                    console.error(`Error processing audio file: ${err.message}`);
                    rejectFFmpeg(err);
                })
                .run();
        });
        if (process.env.UNLINK_FILES === 'true') {
            // Clean up temp file
            await fsPromises.unlink(tempPath);
        }
        return duration;
    } catch (error) {
        // Clean up temp file in case of error
        if (process.env.UNLINK_FILES === 'true') {
            try {
            await fsPromises.unlink(tempPath);
        } catch (unlinkError) {
                console.error('Error cleaning up temp file:', unlinkError);
            }
        }
        throw error;
    }
}



export async function saveMusicAsAudio(tracks: usefulTrack[], id: string): Promise<AudioFile> {
    console.log(`saveMusicAsAudio: tracks: ${tracks}`);
    if (tracks.length == 0) {
        return undefined;
    }
    // get random track in group
    let track = tracks[Math.floor(Math.random() * tracks.length)];
    let outputPath = path.join(TEMP_DATA_PATH, 'music', `${id}.mp3`);
    let url = track.stems.full.lqMp3Url;
    let segment = undefined;

    // Check if segmentGroups and its second element exist and have segments
    if (track.segmentGroups && track.segmentGroups[0] && track.segmentGroups[0].segments) {
        console.log(`segment group segments: ${track.segmentGroups[0].segments}`);
        try {
            // Check if there is more than one segment
            if (track.segmentGroups[0].segments.length > 0) {
                segment = track.segmentGroups[0].segments[0];
            }
        } catch (e) {
            console.log(e);
        }
    }

    let duration: number = await downloadFile(id, url, outputPath, segment);
    console.log(`current file duration: ${duration}`);
    return new AudioFile(id, outputPath, duration, -1);
}
// returns duration of downloaded file
export async function downloadFile(track_id: string, url: string, outputPath: string, segment: Segment): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            let tempPath = path.join(TEMP_DATA_PATH, 'music', `${track_id}_raw.mp3`);
            const fileStream = fs.createWriteStream(tempPath);
            response.body.pipe(fileStream);

            await new Promise<void>((resolveStream, rejectStream) => {
                fileStream.on('finish', () => resolveStream());
                fileStream.on('error', (err) => rejectStream(err));
            });

            console.log(`Download of raw file ${tempPath} completed!`);

            await new Promise<void>((resolveFFmpeg, rejectFFmpeg) => {
                const ffmpegCommand = ffmpeg(tempPath)
                    .output(outputPath)
                    .audioFilters(`volume=0.5`);
                if (segment != undefined) {
                    ffmpegCommand.setStartTime(segment.startTime);
                    ffmpegCommand.setDuration(segment.duration < 60 ? segment.duration : 60);
                } else {
                    ffmpegCommand.setDuration(30);
                }


                ffmpegCommand
                    .on('end', async () => {
                        console.log(`Audio processing completed: ${outputPath}`);
                        if (process.env.UNLINK_FILES === 'true') {
                            fs.unlink(tempPath, (err) => {
                                if (err) console.error(`Error deleting temporary file: ${err}`);
                                else console.log(`Temporary file ${tempPath} deleted`);
                            });
                        }
                        resolveFFmpeg();
                    })
                    .on('error', (err: Error) => {
                        console.error(`Error processing audio file: ${err.message}`);
                        if (process.env.UNLINK_FILES === 'true') {
                            fs.unlink(tempPath, () => { });
                        }
                        rejectFFmpeg(err);
                    })
                    .run();
            });

            // Get duration after ffmpeg processing is complete
            if (segment == undefined) {
                resolve(30);
            } else {
                resolve(round(segment.duration, 2));
            }

        } catch (error) {
            console.error('Error in downloadFile:', error);
            reject(error);
        }
    });
}