import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, StyleSheet, TouchableOpacity, View, Button, Text, Modal, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriveList from './DriveList';
import { connectToPodGen } from '../scripts/s3';
import { ProcessingStatus, ProcessingStep } from '@shared/processing';
import 'react-native-get-random-values';
import { ObjectId } from 'bson';
import { useDocumentPicker } from '@/hooks/useDocumentPicker';
import { Colors } from '../constants/Colors';
import { trackEvent } from '@/scripts/mixpanel';
import { useToast } from '@/state/ToastContext';
import { requestNotificationPermission } from '@/scripts/onesignal';

const UploadButton: React.FC<{
  userId: ObjectId,
  showProcessingBanner: boolean, 
  setShowProcessingBanner: (show: boolean) => void,
}>
  = ({ userId, showProcessingBanner, setShowProcessingBanner }) => {
    const { showToast } = useToast();
    const { fileAsset, isLoading, promptIOSPicker } = useDocumentPicker();

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
            // TODO: Implement Google Drive picker
            showToast('Google Drive integration coming soon');
          }
        }
      );
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
      startPodGenerator()
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
      </>
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
});

export default UploadButton;