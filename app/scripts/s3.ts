import { BASE_URL } from './mongoSecurity';
import { ProcessingStep } from '../../shared/src/processing';
import { socket } from './socket';
import { ObjectId } from 'bson';
import { FileAsset } from '@shared/iosfilesystem';
import * as FileSystem from 'expo-file-system';

export const connectToPodGen = async (
    fileAsset: FileAsset,
    userId: ObjectId,
    new_pod_id: ObjectId,
    onUpdate: (update: ProcessingStep) => void
) => {
    try {
        listenToPodGen(new_pod_id, onUpdate);
        console.log('sending to podgen')
        const response = await FileSystem.uploadAsync(`${BASE_URL}pod/trigger_creation`, fileAsset.uri, {
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            parameters: {
                user_id: userId.toString(),
                new_pod_id: new_pod_id.toString()
            },
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.status !== 200) {
            throw new Error(`Upload failed with status ${response.status}`);
        }

        return JSON.parse(response.body);
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
    // try {
    //     listenToPodGen(new_pod_id, onUpdate);
    //     const response = await fetch(`${BASE_URL}pod/trigger_creation`, {
    //         method: 'POST',
    //         body: formData,
    //         headers: {
    //             // Don't set Content-Type header - browser will set it with boundary
    //             'Accept': 'application/json',
    //         },
    //     });

    //     if (!response.ok) {
    //         throw new Error(`HTTP error! status: ${response.status}`);
    //     }

        

    //     return true;
    // } catch (error) {
    //     console.error('Connection error:', error);    
    //     socket.off(`pod:${new_pod_id.toString()}:status`);
    //     return false;    
    // }
};


export const uploadWithFileSystem = async (fileAsset: FileAsset, userId: string, podId: string) => {
    try {
        const response = await FileSystem.uploadAsync(`${BASE_URL}pod/trigger_creation`, fileAsset.uri, {
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            parameters: {
                user_id: userId,
                new_pod_id: podId
            },
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.status !== 200) {
            throw new Error(`Upload failed with status ${response.status}`);
        }

        return JSON.parse(response.body);
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};


export function listenToPodGen(pod_id: ObjectId, onUpdate: (update: ProcessingStep) => void) {
    const eventName = `pod:${pod_id.toString()}:status`;
    
    // Remove any existing listeners first to prevent duplicates
    socket.off(eventName);
    
    // Add new listener
    socket.on(eventName, (update: ProcessingStep) => {
        console.log('Received update:', update); // Add debugging
        onUpdate(update);
        
        if (update.status === 'completed') {
            socket.off(eventName);
        }
    });
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