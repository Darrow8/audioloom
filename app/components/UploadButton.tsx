import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, StyleSheet, TouchableOpacity, View, Button, Text, Modal, ActivityIndicator, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriveList, { DriveFile } from './DriveList';
import { connectToPodGen } from '../scripts/s3';
import { ProcessingStatus, ProcessingStep } from '@shared/processing';
import 'react-native-get-random-values';
import { ObjectId } from 'bson';
import { useDocumentPicker } from '@/hooks/useDocumentPicker';
import { Colors } from '../constants/Colors';
import { trackEvent } from '@/scripts/mixpanel';
import { useToast } from '@/state/ToastContext';
import { requestNotificationPermission } from '@/scripts/onesignal';
import { GoogleDrivePicker } from '@/components/GoogleDrivePicker';

const UploadButton: React.FC<{
  userId: ObjectId,
  showProcessingBanner: boolean,
  setShowProcessingBanner: (show: boolean) => void,
}>
  = ({ userId, showProcessingBanner, setShowProcessingBanner }) => {
    const { showToast } = useToast();
    const { fileAsset, isLoading, promptIOSPicker } = useDocumentPicker();
    const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);
    const handleUploadPress = () => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose from Files', 'Choose from Google Drive'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            promptIOSPicker();
          } else if (buttonIndex === 2) {
            setShowGoogleDriveModal(true);
          }
        }
      );
    };

    const handleGoogleDriveFilePick = (file: DriveFile) => {
      try {
        // Create a file-like object that matches your fileAsset structure
        const googleDriveFileAsset = {
          name: file.name,
          size: file.size,
          // uri: `data:${file.mimeType};base64,${file.content}`,
          mimeType: file.mimeType,
        };
      } catch (error) {
        console.error('Error processing Google Drive file:', error);
        // showToast('Error processing file from Google Drive');
        // setShowProcessingBanner(false);
      }
    };

    useEffect(() => {
      async function startPodGenerator() {
        if (fileAsset == null) {
          return;
        }
        if (showProcessingBanner) {
          console.log('already processing')
          return;
        }
        setShowProcessingBanner(true);
        let newPodId = new ObjectId();
        trackEvent('pod_upload', {
          pod_id: newPodId,
          pod_title: fileAsset.name,
          uploader_id: userId,
        });
        requestNotificationPermission()
        await connectToPodGen(fileAsset, userId, newPodId, (update: ProcessingStep) => {
          console.log('update', update)
          if (update.status === ProcessingStatus.COMPLETED) {
            console.log('completed!')
            setShowProcessingBanner(false);
          }
          if (update.status === ProcessingStatus.SUCCESS) {
            setShowProcessingBanner(true);
          }
          if (update.status === ProcessingStatus.ERROR) {
            console.log('error')
            setShowProcessingBanner(false);
            showToast('Error uploading file, please try again');
          }
        })
      }
      console.log('fileAsset', fileAsset)
      console.log('isLoading', isLoading)
      // startPodGenerator()
    }, [fileAsset])


    return (
      <>
        {showProcessingBanner == false && (
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleUploadPress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Feather name="plus" size={30} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={showGoogleDriveModal}
          animationType="slide"
          onRequestClose={() => setShowGoogleDriveModal(false)}
        >
          <View style={styles.modalContainer}>
            <SafeAreaView >
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Google Drive Files</Text>
                <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowGoogleDriveModal(false)}
            >
              <Feather name="x" size={24} color="black" />
            </TouchableOpacity>
              </View>
              <GoogleDrivePicker
                onFilePick={handleGoogleDriveFilePick}
                allowedMimeTypes={['audio/mpeg', 'audio/mp4', 'audio/wav']}
                maxFileSize={500 * 1024 * 1024} // 500MB
              />
            </SafeAreaView>

          </View>
        </Modal>
      </>
    );
  };

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  container: {
    position: 'absolute',
    bottom: 50,
    right: 50,
    zIndex: 1000,
  },
  button: {
    backgroundColor: Colors.theme.lightBlue,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
});

export default UploadButton;