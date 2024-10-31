import fs from 'fs';
import { usefulTrack, Segment } from './util_music';
import { AudioFile } from './util_pod';
import ffmpeg from 'fluent-ffmpeg';
import { getAudioDuration, round } from './process_audio';
import { TEMP_DATA_PATH } from './init';
import fetch from 'node-fetch';

export async function saveMusicAsAudio(tracks: usefulTrack[], id:string): Promise<AudioFile> {
    console.log(`saveMusicAsAudio: tracks: ${tracks}`);
    // default to first track for now
    let track = tracks[0];
    if (tracks.length == 0) {
        return undefined;
    }
    let outputPath = `${TEMP_DATA_PATH}/music/${id}.mp3`; // Replace with your desired local output file name
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
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error downloading file: ${response.statusText}`);
            reject();
        }

        let tempPath = `${TEMP_DATA_PATH}/music/${track_id}_raw.mp3`; // Temporary file path
        const fileStream = fs.createWriteStream(tempPath);
        response.body.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`Download of ${tempPath} completed!`);
            const ffmpegCommand = ffmpeg(tempPath).output(outputPath);

            if (segment != undefined) {
                ffmpegCommand.setStartTime(segment.startTime);
                    ffmpegCommand.setDuration(segment.duration < 60 ? segment.duration : 60);
            } else {
                ffmpegCommand.setDuration(60);
            }
            
            ffmpegCommand.on('end', async () => {
                console.log(`Audio processing completed: ${outputPath}`);
                    // Delete the temporary file
                    // fs.unlinkSync(tempPath);
                // get duration
                if(segment == undefined){
                    let dur = await getAudioDuration(outputPath);
                    resolve(round(dur,2));

                }else{
                    resolve(round(segment.duration, 2));

                }

            })
                .on('error', (err: Error) => {
                    console.error(`Error processing audio file: ${err.message}`);
                    reject();
                })
                .run();
        });

        fileStream.on('error', (err: Error) => {
            console.error(`Error writing to file: ${err.message}`);
            reject()
        });
    })
}