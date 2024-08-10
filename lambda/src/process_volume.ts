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

        const command = ffmpeg(inputFile)
            .audioFilters('loudnorm=I=-24:TP=-2:LRA=11:print_format=json')
            .outputOptions('-f', 'null')
            .on('stderr', (stderrLine) => {
                try {
                    const parsed = JSON.parse(stderrLine);
                    if (parsed.input_i !== undefined) {
                        stats = parsed;
                    }
                } catch (error) {
                    // Ignore parsing errors
                }
            })
            .on('end', () => {
                if (stats) {
                    resolve(stats);
                } else {
                    reject(new Error('Failed to parse loudness statistics'));
                }
            })
            .on('error', reject)
            .run();
    });
};

const normalizeLoudness = (inputFile: string, outputFile: string, stats: LoudnormStats): Promise<void> => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputFile)
            .audioFilters(`loudnorm=I=-24:TP=-2:LRA=11:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}`)
            .output(outputFile)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
};

const loudnormTwoPass = async (inputFile: string, outputFile: string): Promise<void> => {
    try {
        const stats = await analyzeLoudness(inputFile);
        await normalizeLoudness(inputFile, outputFile, stats);
        console.log('Loudness normalization completed successfully.');
    } catch (error) {
        console.error('Error during loudness normalization:', error);
    }
};