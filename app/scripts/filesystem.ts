import { FileAsset } from '@shared/iosfilesystem';
import * as FileSystem from 'expo-file-system';

export const fileAssetToFile = async (fileAsset: FileAsset): Promise<File | null> => {
    try {
        const response = await fetch(fileAsset.uri);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        console.log('blob: ' + blob.size);
        console.log('fileAsset: ' + fileAsset.size);
        console.log('fileAsset.name: ' + fileAsset.name);
        return new File([blob], fileAsset.name, {
            type: fileAsset.mimeType,
            lastModified: fileAsset.lastModified,
        });
    } catch (error) {
        console.error('Error converting FileAsset to File:', error);
        return null;
    }
};