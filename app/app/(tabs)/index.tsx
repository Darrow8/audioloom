import React, { useState, useEffect, useRef } from 'react';
import { Modal, StyleSheet, View, ScrollView, PanResponder, Text, Button } from 'react-native';
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

const Listen = () => {
  const [sound, setSound] = useState<Audio.Sound>();
  const [uploadVisible, setUploadVisible] = useState(false);
  const [showProcessingBanner, setShowProcessingBanner] = useState(false);
  const { state } = useStateContext();
  const [pods, setPods] = useState<Pod[]>([]); // Add Pod type to useState
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [currentPod, setCurrentPod] = useState<Pod>();
  const [toast, setToast] = useState<{message: string, visible: boolean}>({
    message: '',
    visible: false
  });

  useEffect(() => {
    if (!state.user) return;

    const pod_ids = state.user.pods.map((id) => new ObjectId(id));
    // get initial pods

    Promise.all(pod_ids.map(async (id) => {
      try {
        const pod = await getRecordById('pods', id);
        if(pod) {
          return pod as Pod;
        } else {
          return undefined;
        }
      } catch (error) {
        setToast({message: 'Failed to load pod', visible: true});
        return undefined;
      }
    })).then(resolvedPods => {
      const validPods = resolvedPods.filter((pod) => pod != undefined);
      // Sort pods by created_at date, newest first
      const sortedPods = validPods.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      console.log(`validPods: ${sortedPods}`);
      setPods(sortedPods);
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
    socket.on('error', (data) => {
      console.log("error: ", data);
      setToast({message: 'Connection error occurred', visible: true});
    });
  }, [state.user?.pods]);

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({...prev, visible: false}));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const handlePodClick = (pod: Pod) => {
    if(pod.status == PodStatus.READY){
      if(currentPod?._id.toString() != pod._id.toString() && sound) {
        sound.unloadAsync();
      }
      setCurrentPod(pod);
      setIsPlayerModalVisible(true);
    }else{
      setToast({message: 'Pod is not ready yet', visible: true});
    }
  }

  const handleCloseToast = () => {
    setToast(prev => ({...prev, visible: false}));
  };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                return gestureState.dy > 10;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 50) {
                    setIsPlayerModalVisible(false);
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
            <View style={styles.banner}>
              <Text style={styles.bannerText}>Processing...</Text>
            </View>
          )}
          <ScrollView contentContainerStyle={styles.songList}>
            {pods.map((pod: Pod) => 
              pod.status != PodStatus.ERROR && (
                <View key={(pod._id).toString()}>
                  <PodComponent 
                    pod={pod}
                    onPodClick={() => handlePodClick(pod)}
                  />
                </View>
              )
            )}
          </ScrollView>

          <UploadButton 
            userId={state.user._id} 
            showProcessingBanner={showProcessingBanner}
            setShowProcessingBanner={setShowProcessingBanner}
            toast={toast}
            setToast={setToast}
          />
          <GestureRecognizer
            style={{flex: 1}}
            onSwipeUp={ () => setIsPlayerModalVisible(true) }
            onSwipeDown={ () => setIsPlayerModalVisible(false) }
          >
            <Modal
              animationType="slide"
              transparent={true}
              visible={isPlayerModalVisible}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer} {...panResponder.panHandlers}>
                  <View style={styles.modalContent}>
                    <View style={styles.dragIndicator} />
                    <PodPlayer pod={currentPod ?? null} sound={sound} setSound={setSound} />
                  </View>
                </View>
              </View>
            </Modal>
          </GestureRecognizer>
          {toast.visible && (
            <View style={styles.toast}>
              <View style={styles.toastContent}>
                <Text style={styles.toastText}>{toast.message}</Text>
                <Text style={styles.closeButton} onPress={handleCloseToast}>✕</Text>
              </View>
            </View>
          )}
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
  banner: {
    backgroundColor: '#007AFF',
    padding: 8,
    marginBottom: 8,
  },
  bannerText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Listen;
