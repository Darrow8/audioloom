import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// Set the path to the FFmpeg binary
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

interface LoudnormStats {
    input_i: number;
    input_tp: number;
    input_lra: number;
    input_thresh: number;
    target_offset: number;
}

const analyzeLoudness = (inputFile: string): Promise<LoudnormStats> => {
    return new Promise((resolve, reject) => {
        let stats: LoudnormStats | null = null;
        let errorOutput = '';

        const command = ffmpeg(inputFile)
            .audioFilters('loudnorm=I=-16:TP=-1:LRA=11:print_format=json')
            .outputOptions('-f', 'null')
            .on('stderr', (stderrLine) => {
                try {
                    const parsed = JSON.parse(stderrLine);
                    if (parsed.input_i !== undefined) {
                        stats = parsed;
                    }
                } catch (error) {
                    // Collect stderr output for error reporting
                    errorOutput += stderrLine + '\n';
                }
            })
            .on('end', () => {
                if (stats) {
                    resolve(stats);
                } else {
                    reject(new Error(`Failed to parse loudness statistics. FFmpeg output: ${errorOutput}`));
                }
            })
            .on('error', (err) => {
                reject(new Error(`FFmpeg error: ${err.message}\nOutput: ${errorOutput}`));
            })
            .run();
    });
};

const normalizeLoudness = (inputFile: string, outputFile: string, stats: LoudnormStats): Promise<void> => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputFile)
            .audioFilters(`loudnorm=` +
                `I=-16:` +          // Target integrated loudness
                `TP=-1:` +          // True peak target
                `LRA=11:` +         // Loudness range target
                `measured_I=${stats.input_i}:` +
                `measured_TP=${stats.input_tp}:` +
                `measured_LRA=${stats.input_lra}:` +
                `measured_thresh=${stats.input_thresh}:` +
                `offset=${stats.target_offset}:` +
                `linear=true`        // Use linear normalization
            )
            .audioCodec('pcm_s16le')  // Use WAV codec for highest quality
            .audioFrequency(44100)    // Standard sample rate
            .audioChannels(2)         // Stereo output
            .output(outputFile)
            .on('start', (cmd) => {
                console.log('Started normalization:', cmd);
            })
            .on('end', () => resolve())
            .on('error', reject)
            .run();
    });
};

const loudnormTwoPass = async (inputFile: string, outputFile: string): Promise<void> => {
    try {
        console.log('Analyzing audio loudness...');
        const stats = await analyzeLoudness(inputFile);
        console.log('Loudness analysis complete:', stats);
        
        console.log('Normalizing audio...');
        await normalizeLoudness(inputFile, outputFile, stats);
        console.log('Loudness normalization completed successfully.');
    } catch (error) {
        console.error('Error during loudness normalization:', error);
        throw error; // Re-throw to handle at higher level
    }
};