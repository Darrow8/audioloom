import fs from 'fs';
import { usefulTrack, Segment } from '@shared/music.js';
import { AudioFile } from '@shared/line.js';
import ffmpeg from 'fluent-ffmpeg';
import { getAudioDuration, round } from '@pod/process_audio.js';
import { TEMP_DATA_PATH } from '@pod/init.js';
import fetch from 'node-fetch';
import path from 'path';

export async function saveMusicAsAudio(tracks: usefulTrack[], id:string): Promise<AudioFile> {
    console.log(`saveMusicAsAudio: tracks: ${tracks}`);
    // get random track in group
    let track = tracks[Math.floor(Math.random() * tracks.length)];
    if (tracks.length == 0) {
        return undefined;
    }
    let outputPath = path.join(TEMP_DATA_PATH, 'music', `${id}.mp3`); // Replace with your desired local output file name
    let url = track.stems.full.lqMp3Url;
    let segment = undefined;

    // Check if segmentGroups and its first element exist and have segments
    if (track.segmentGroups && track.segmentGroups[0] && track.segmentGroups[0].segments) {
        console.log(`segment group segments: ${track.segmentGroups[0].segments}`);
        try {
            // Check if there is more than one segment
            if (track.segmentGroups[0].segments.length > 1) {
                segment = track.segmentGroups[0].segments[1];
            } else if (track.segmentGroups[0].segments.length > 0) {
                segment = track.segmentGroups[0].segments[0];
            }
        } catch (e) {
            console.log(e);
        }
    }

    let duration : number = await downloadFile(id, url, outputPath, segment);

    return new AudioFile(id,outputPath,duration,-1);


}
// returns duration of downloaded file
export async function downloadFile(track_id: string, url: string, outputPath: string, segment: Segment) : Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            let tempPath = path.join(TEMP_DATA_PATH, 'music', `${track_id}_raw.mp3`);
            const fileStream = fs.createWriteStream(tempPath);
            response.body.pipe(fileStream);
            
            await new Promise((resolveStream, rejectStream) => {
                fileStream.on('finish', resolveStream);
                fileStream.on('error', rejectStream);
            });
            
            console.log(`Download of ${tempPath} completed!`);
            
            await new Promise<void>((resolveFFmpeg, rejectFFmpeg) => {
                const ffmpegCommand = ffmpeg(tempPath).output(outputPath);

                if (segment != undefined) {
                    ffmpegCommand.setStartTime(segment.startTime);
                    ffmpegCommand.setDuration(segment.duration < 60 ? segment.duration : 60);
                } else {
                    ffmpegCommand.setDuration(60);
                }
                
                ffmpegCommand
                    .on('end', async () => {
                        console.log(`Audio processing completed: ${outputPath}`);
                        resolveFFmpeg();
                    })
                    .on('error', (err: Error) => {
                        console.error(`Error processing audio file: ${err.message}`);
                        rejectFFmpeg(err);
                    })
                    .run();
            });

            // Get duration after ffmpeg processing is complete
            if(segment == undefined) {
                let dur = await getAudioDuration(outputPath);
                resolve(round(dur, 2));
            } else {
                resolve(round(segment.duration, 2));
            }

        } catch (error) {
            console.error('Error in downloadFile:', error);
            reject(error);
        }
    });
}