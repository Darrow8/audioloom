import React, { useState, useEffect, useRef } from 'react';
import { Modal, StyleSheet, View, ScrollView, PanResponder, Text, Button, ActivityIndicator, Share, TouchableOpacity } from 'react-native';
import UploadButton from '../../components/UploadButton';
import PodComponent from '../../components/Pod';
import PodPlayer from '@/components/PodPlayer';
import { useStateContext } from '@/state/StateContext';
import { getRecordById } from '@/scripts/mongoHandle';
import GestureRecognizer from 'react-native-swipe-gestures';
import { socket } from '@/scripts/socket';
import { watchDocumentsPods } from '@/scripts/mongoClient';
import { Pod, PodStatus } from '@shared/pods';
import { MongoChangeStreamData } from '@shared/mongodb';
import { connectToPodGen } from '@/scripts/s3';
import { ObjectId } from 'bson';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import TrackPlayer from 'react-native-track-player';
import { router, SplashScreen } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ProgressBanner } from '@/components/ProgressBanner';
import { FontAwesome5 } from '@expo/vector-icons';

const Listen = () => {
  // const [sound, setSound] = useState<Audio.Sound>();
  const [uploadVisible, setUploadVisible] = useState(false);
  const [showProcessingBanner, setShowProcessingBanner] = useState(false);
  const { state } = useStateContext();
  const [pods, setPods] = useState<Pod[]>([]);
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [currentPod, setCurrentPod] = useState<Pod>();
  const [isPodsLoading, setIsPodsLoading] = useState(true);

  useEffect(() => {
    const getPods = async () => {
      if (!state.user) return;
      const pod_ids = state.user.pods.map((id) => new ObjectId(id));
      // get initial pods
      await Promise.all(pod_ids.map(async (id) => {
        try {
          const pod = await getRecordById('pods', id);
          if (pod) {
            return pod as Pod;
          } else {
            return undefined;
          }
        } catch (error) {
          return undefined;
        }
      })).then(async (resolvedPods) => {
        const validPods = resolvedPods.filter((pod) => pod != undefined);
        // Sort pods by created_at date, newest first
        const sortedPods = validPods.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setPods(sortedPods);
        setIsPodsLoading(false);
      });
      watchDocumentsPods(pod_ids, (stream_data: MongoChangeStreamData) => {
        setPods(currentPods => {
          const updatedPods = currentPods.map((pod) => {
            if (pod._id.toString() === stream_data.documentKey._id.toString()) {
              const fullDoc = stream_data.fullDocument;
              return {
                ...fullDoc,
                created_at: new Date(fullDoc.created_at)
              } as Pod;
            }
            return pod;
          });
          // Sort pods by created_at date, newest first
          return updatedPods.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
      });
      socket.on('error', async (error) => {
        console.log("error: ", error);
      });
    }
    getPods()
  }, [state.user?.pods]);

  const handlePodClick = (pod: Pod) => {
    if (pod.status == PodStatus.READY) {
      setCurrentPod(pod);
      setIsPlayerModalVisible(true);
    } else {
      console.log('pod is not ready');
    }
  }

  const handleModalClose = () => {
    setIsPlayerModalVisible(false);
    if (currentPod) {
      TrackPlayer.pause();
      TrackPlayer.setQueue([]);
      // TrackPlayer.seekTo(0);
    }
  }
  const handleShareClick = (pod: Pod) => {
    Share.share({
      message: `Check out this podcast: ${pod.title} by ${pod.author}`,
      url: `https://audioloom.io/listen?pod=${pod._id}`
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        if (currentPod) {
          // Allow both up and down gestures when a pod is selected
          return Math.abs(gestureState.dy) > 10;
        } else {
          // Only allow downward gestures when no pod is selected
          return gestureState.dy > 10;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (currentPod) {
          if (gestureState.dy > 50) {
            // Swipe down to close
            console.log('swipe down to close');
            setIsPlayerModalVisible(false);
          } else if (gestureState.dy < -50 && currentPod != undefined) {
            // Swipe up to open
            console.log('swipe up to open');
            setIsPlayerModalVisible(true);
          }
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {state.user ? (
        <>
          <Modal
            animationType="slide"
            transparent={true}
            visible={uploadVisible}
            onRequestClose={() => {
              setUploadVisible(!uploadVisible);
            }}>

          </Modal>
          {showProcessingBanner && (
            <ProgressBanner time={2} />
          )}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.songList}
          >
            {isPodsLoading ?
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.theme.lightBlue} />
              </View>
              : pods.map((pod: Pod) =>
                pod.status != PodStatus.ERROR && (
                  <View key={(pod._id).toString()}>
                    <PodComponent
                      pod={pod}
                      onPodClick={() => handlePodClick(pod)}
                      onShareClick={() => handleShareClick(pod)}
                    />
                  </View>
                )
              )}
          </ScrollView>

          <UploadButton
            userId={state.user._id}
            showProcessingBanner={showProcessingBanner}
            setShowProcessingBanner={setShowProcessingBanner}
          />
          <GestureRecognizer
            style={{ flex: 1 }}
            onSwipeDown={() => handleModalClose()}
          >
            <Modal
              animationType="slide"
              transparent={true}
              visible={isPlayerModalVisible}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer} {...panResponder.panHandlers}>
                  <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.shareButton} onPress={() => handleShareClick(currentPod as Pod)}>
                      <FontAwesome5 name="share" size={16} color={Colors.theme.lightBlue} />
                    </TouchableOpacity>
                    <View style={styles.dragIndicator} />
                    <PodPlayer pod={currentPod as Pod} />
                  </View>
                </View>
              </View>
            </Modal>
          </GestureRecognizer>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    height: '65%',
  },
  songList: {
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '40%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    // marginBottom: 10,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: -150 }],
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 16,
    borderRadius: 12,
    zIndex: 1000,
    width: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toastText: {
    color: 'white',
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  closeButton: {
    color: 'white',
    fontSize: 16,
    padding: 4,
  },
  shareButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 5,
    // backgroundColor: '#fff',
    // borderRadius: 50,
    // borderWidth: 1,
    // borderColor: 'rgba(0, 0, 0, 0.1)',
  }
});

export default Listen;
