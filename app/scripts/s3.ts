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
