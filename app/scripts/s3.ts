import { BASE_URL } from './mongoSecurity';


export const uploadToS3 = async (file: File, userId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('_id', userId);

    const response = await fetch(`${BASE_URL}pod/file/upload`, {
        method: 'POST',
        body: formData,
    });
    return await response.json()
}

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