import React, { useState, useEffect, useRef } from 'react';
import { Modal, StyleSheet, View, ScrollView, PanResponder } from 'react-native';
import UploadButton from '../../components/UploadButton';
import PodComponent from '../../components/Pod';
// import { Pod } from '@shared/types/pod';
import PodPlayer from '@/components/PodPlayer';
import { useStateContext } from '@/state/StateContext';
import { getRecordById } from '@/scripts/mongoHandle';
import SoundPlayer from 'react-native-sound-player'
import GestureRecognizer from 'react-native-swipe-gestures';
import { socket } from '@/scripts/socket';
import { getAllPods, watchDocumentsPods } from '@/scripts/mongoClient';
import { Pod } from '@shared/pods';
import { MongoChangeStreamData } from '@shared/mongodb';

const Listen = () => {
  const [uploadVisible, setUploadVisible] = useState(false);
  const { state } = useStateContext();
  const [pods, setPods] = useState<Pod[]>([]); // Add Pod type to useState
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [currentPod, setCurrentPod] = useState<Pod>();
  

  useEffect(() => {
    if (!state.user) return;

    const pod_ids = state.user.pods ?? [];
    // get initial pods
    Promise.all(pod_ids.map(async (id) => {
      const pod = await getRecordById('pods', id);
      return pod as Pod | null;
    })).then(resolvedPods => {
      const validPods = resolvedPods.filter((pod): pod is Pod => pod !== null);
        setPods(validPods);
    });
    watchDocumentsPods(pod_ids, (stream_data: MongoChangeStreamData) => {
      setPods(currentPods => currentPods.map((pod) => {
        if (pod._id === stream_data.documentKey._id) {
          const fullDoc = stream_data.fullDocument;
          return {
            ...fullDoc,
            created_at: new Date(fullDoc.created_at)
          } as Pod;
        }
        return pod;
      }));
    });
    socket.on('error', (data, callback) => {
      // Process data
      console.log("error: ", data);
    });
  }, [state.user?.pods]);
  

  const handlePodClick = (pod: Pod) => {
    setCurrentPod(pod);
    setIsPlayerModalVisible(true);
  }


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
          <ScrollView contentContainerStyle={styles.songList}>
            {pods.map((pod) => (
              <PodComponent 
                key={pod._id} 
                pod={pod}
                onPodClick={() => handlePodClick(pod)}
              />
            ))}
          </ScrollView>
          <UploadButton userId={state.user._id}/>
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
                    <PodPlayer pod={currentPod ?? null} />
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
});

export default Listen;
