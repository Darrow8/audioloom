// src/hooks/useDocumentPicker/index.ts
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import { FileAsset, DocumentPickerHook } from '@shared/iosfilesystem';
import { fileAssetToFile } from '@/scripts/filesystem';

export const useDocumentPicker = (): DocumentPickerHook => {
    const [fileAsset, setFileAsset] = useState<FileAsset | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const promptIOSPicker = async (): Promise<void> => {
        setIsLoading(true);
        try {
            console.log('prompting ios picker')
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/docx', 'application/doc', 'text/plain'],
                copyToCacheDirectory: true,
                multiple: false
            });
    
            if (result.canceled) {
                console.log('User cancelled document picker');
                return;
            }
    
            if (result.assets && result.assets.length > 0) {
                const selectedFile = result.assets[0];
    
                if (!selectedFile.uri) {
                    throw new Error('Invalid file URI');
                }
    
                try {
                    const fileInfo = await FileSystem.getInfoAsync(selectedFile.uri);
                    console.log('File info:', fileInfo);
    
                    if (!fileInfo.exists || !fileInfo.size) {
                        throw new Error('Invalid file or size');
                    }
    
                    // Create the file object in the format needed for React Native FormData
                    const fileForUpload = {
                        uri: selectedFile.uri,
                        mimeType: selectedFile.mimeType || 'application/pdf',
                        name: selectedFile.name,
                        size: fileInfo.size
                    } as FileAsset;
    
                    // Log the file object
                    console.log('Created file object:', fileForUpload);
    
                    // Set both the file asset and file
                    setFileAsset(fileForUpload);
                    // setFile(fileForUpload as File);
    
                } catch (fileError) {
                    console.error('File validation error:', fileError);
                    Alert.alert(
                        'File Error',
                        'Unable to access the selected file. Please try again with a different file.'
                    );
                }
            }
        } catch (err) {
            console.error('Document picker error:', err);
            Alert.alert(
                'Error',
                'There was a problem selecting the document. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };
    
    const cleanupOldFiles = async (): Promise<void> => {
        if (Platform.OS === 'ios' && FileSystem.cacheDirectory) {
            try {
                const docs = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
                const currentTime = Date.now();
                const oneHour = 60 * 60 * 1000; // Reduced to 1 hour
    
                await Promise.all(
                    docs.map(async (doc) => {
                        if (doc.startsWith('file_')) { // Only clean up our files
                            const fileUri = `${FileSystem.cacheDirectory}${doc}`;
                            const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
                            if ('modificationTime' in fileInfo &&
                                fileInfo.modificationTime &&
                                currentTime - fileInfo.modificationTime > oneHour) {
                                await FileSystem.deleteAsync(fileUri, { idempotent: true });
                            }
                        }
                    })
                );
            } catch (error) {
                console.error('Cleanup error:', error);
            }
        }
    };

    return {
        isLoading,
        promptIOSPicker,
        fileAsset,
        setFileAsset
    };
};