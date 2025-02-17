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
    try {
        // Check for empty tracks array
        if (!tracks || tracks.length === 0) {
            throw new Error('No tracks provided');
        }

        // step 1: get random track in group
        let track = tracks[Math.floor(Math.random() * tracks.length)];
        let outputPath = path.join(TEMP_DATA_PATH, 'music', `${id}.mp3`);
        let url = track.stems.full.lqMp3Url;

        // Validate segment groups exist
        if (!track.segmentGroups?.[0]?.segments || track.segmentGroups[0].segments.length < 2) {
            throw new Error('Invalid segment groups structure');
        }

        // get random segment in group
        let segment_index = Math.round(Math.random() * (track.segmentGroups[0].segments.length - 1));
        // console.log(`music: segment_index: ${segment_index}`);
        let segment_1 = track.segmentGroups[0].segments[segment_index];
        // let segment_2 = track.segmentGroups[0].segments[segment_index + 1];
        let duration_sum = Math.round(segment_1.duration);

        // step 2: download file
        let duration: number = await improvedDownloadFile(id, url, outputPath, segment_1.startTime, duration_sum);
        let overall_track_duration = Math.floor(track.durationMs / 1000);
        // console.log(`music: current file duration: ${duration}`);
        // console.log(`music: track duration: ${overall_track_duration}`);
        return new AudioFile(id, outputPath, duration, overall_track_duration);
    } catch (error) {
        throw new Error(`Failed to save music as audio: ${error.message}`);
    }
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