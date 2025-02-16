import { FileAsset } from '@shared/iosfilesystem';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export const savePlaybackPosition = async (podId: string, position: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(`playback_${podId}`, JSON.stringify(position));
  } catch (error) {
    console.error("Error saving playback position:", error);
  }
};

export const getPlaybackPosition = async (podId: string): Promise<number> => {
  try {
    const position = await AsyncStorage.getItem(`playback_${podId}`);
    return position ? JSON.parse(position) : 0;
  } catch (error) {
    console.error("Error retrieving playback position:", error);
    return 0;
  }
};
