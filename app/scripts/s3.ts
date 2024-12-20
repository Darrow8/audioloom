import { BASE_URL, makeAuthenticatedRequest } from './mongoSecurity';
import { ProcessingStep } from '../../shared/src/processing';
import { socket } from './socket';
import { ObjectId } from 'bson';
import { FileAsset } from '@shared/iosfilesystem';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { FileSystemUploadResult } from 'expo-file-system';
import { env } from '../config/env';

async function authenticatedFileUpload(url: string, fileUri: string, options?: FileSystem.FileSystemUploadOptions): Promise<FileSystemUploadResult> {
    const accessToken = await SecureStore.getItemAsync('auth0AccessToken');
    if(accessToken == '' || accessToken == null) {
        throw new Error('No access token available');
    }

    if(env.RIVET_API_KEY == '' || env.RIVET_API_KEY == null) {
        throw new Error('No RIVET_API_KEY available');
    }

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        // 'Content-Type': 'multipart/form-data',
        'X-API-Key': env.RIVET_API_KEY
    }
    return await FileSystem.uploadAsync(url, fileUri, {
        ...options,
        headers: headers
    });
}


export const connectToPodGen = async (
    fileAsset: FileAsset,
    userId: ObjectId,
    new_pod_id: ObjectId,
    onUpdate: (update: ProcessingStep) => void
) => {
    try {
        listenToPodGen(new_pod_id, onUpdate);
        console.log('sending to podgen')
        const response = await authenticatedFileUpload(`${BASE_URL}pod/trigger_creation`, fileAsset.uri, {
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            parameters: {
                user_id: userId.toString(),
                new_pod_id: new_pod_id.toString()
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


export const uploadWithFileSystem = async (fileAsset: FileAsset, userId: string, podId: string) => {
    try {
        const response = await authenticatedFileUpload(`${BASE_URL}pod/trigger_creation`, fileAsset.uri, {
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            parameters: {
                user_id: userId,
                new_pod_id: podId
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
    const response = await makeAuthenticatedRequest(`${BASE_URL}db/get_audio`, 'POST', {
        "audio_key": audio_key
    });
    return response;
}