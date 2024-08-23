import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, StyleSheet, TouchableOpacity, View, Button, Text, Modal, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  GDrive,
  MimeTypes
} from "@robinbobin/react-native-google-drive-api-wrapper";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriveList from './DriveList';

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/drive.readonly'], // what API you want to access on behalf of the user, default is email and profile
  iosClientId: '554636964216-v3fsfvau5939st9bjquk8to2fnt0m2f1.apps.googleusercontent.com', // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
});

const UploadButton = () => {
  const [file, setFile] = useState<any>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const gdrive = new GDrive();

  const testAccessToken = async () => {
    try {
      await gdrive.files.list({ pageSize: 1 });
    } catch (error: any) {
      if (error.message.includes('Invalid Credentials')) {
        await AsyncStorage.removeItem('gdriveAccessToken');
        await GoogleSignin.signIn();
        gdrive.accessToken = (await GoogleSignin.getTokens()).accessToken;
        await AsyncStorage.setItem('gdriveAccessToken', gdrive.accessToken);
      }
    }
  }

  const gSignIn = async () => {
    setIsLoading(true);
    try {
      let gdriveAccessToken = await AsyncStorage.getItem('gdriveAccessToken');
      if (gdriveAccessToken != null && gdriveAccessToken != '') {
        gdrive.accessToken = gdriveAccessToken;
        await testAccessToken();
      } else {
        await GoogleSignin.signIn();
        gdrive.accessToken = (await GoogleSignin.getTokens()).accessToken;
        await AsyncStorage.setItem('gdriveAccessToken', gdrive.accessToken);
      }

      const files = await gdrive.files.list({
        q: "mimeType='application/pdf' or mimeType='text/plain'",
        fields: 'files(id, name, mimeType)',
      })
      console.log('files', files)

      if (files.files && files.files.length > 0) {
        setDriveFiles(files.files);
        setModalVisible(true);
      } else {
        console.log('No files found in Google Drive');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const promptIOSPicker = async () => {
    setIsLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // all files
        // You can specify the type, e.g., 'image/*' for images only
      });
      if (result.assets && result.assets.length > 0) {

        const iosFile = result.assets[0];
        console.log('file from ios')
        console.log('File name:', iosFile.name);
        console.log('File size:', iosFile.size);
        console.log('File URI:', iosFile.uri);
        setFile(iosFile);
      } else {
        console.log('No file selected');
      }
    } catch (err) {
      console.error('Error picking document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // open the action sheet
  const openActions = async () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Upload a file",
        options: ['Cancel', 'Google Drive', 'IOS File Manager'],
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (buttonIndex === 1) {
          console.log("Google Drive")
          await gSignIn();
        } else if (buttonIndex === 2) {
          console.log("File Manager")
          await promptIOSPicker()
        }
      },
    );
  }
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={openActions} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <Feather name="plus" size={30} color="#fff" />
        )}
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <DriveList
          files={driveFiles}
          onFilePress={(file) => {
            console.log('Selected file:', file);
            setModalVisible(false);
            setFile(file)
          }}
          onClose={() => {
            setModalVisible(false);
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    right: 50,
    zIndex: 1000,
  },
  button: {
    backgroundColor: '#007AFF',
    width: 75,
    height: 75,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    opacity: 1,
  },
});

export default UploadButton;