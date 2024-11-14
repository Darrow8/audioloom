import { BASE_URL } from './mongoSecurity';
import { ProcessingStep } from '../../shared/src/processing';

interface SSEListener {
    close: () => void;
}

export const connectToSSE = (
    file: File,
    userId: string,
    onUpdate: (update: ProcessingStep) => void
): Promise<SSEListener> => {
    return new Promise(async (resolve, reject) => {
        const formData = new FormData();
        // formData.append("file", file);
        // formData.append("_id", userId);

        try {
            const response = await fetch('http://localhost:3000/pod/test', {
                method: 'GET',
                // body: formData,
                // headers: {
                //     'Content-Type': 'application/json',
                //     'Accept': 'text/event-stream',
                // },
            });

            if (!response.body) {
                throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const readStream = async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
                            console.log('Stream complete');
                            break;
                        }

                        // Decode the chunk and add it to our buffer
                        buffer += decoder.decode(value, { stream: true });

                        // Process any complete messages in the buffer
                        const messages = buffer.split('\n\n');
                        buffer = messages.pop() || ''; // Keep the last incomplete chunk in the buffer

                        messages
                            .map(msg => msg.replace(/^data: /, ''))
                            .filter(msg => msg.trim())
                            .forEach(msg => {
                                try {
                                    const data = JSON.parse(msg);
                                    onUpdate(data as ProcessingStep);
                                } catch (e) {
                                    console.warn('Failed to parse message:', msg);
                                }
                            });
                    }
                } catch (error) {
                    console.error('Stream error:', error);
                    reject(error);
                }
            };

            // Start reading the stream
            readStream();

            // Return an object with methods to control the connection
            resolve({
                close: () => {
                    reader.cancel();
                }
            });

        } catch (error) {
            console.error('Connection error:', error);
            reject(error);
        }
    });
};

export const getAudioFromS3 = async (audio_key: string) => {
    const response = await fetch(`${BASE_URL}db/get_audio`, {
        method: 'POST',
        body: JSON.stringify({ "audio_key": audio_key }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return await response.json()
}