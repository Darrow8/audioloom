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
    console.log("pod_ids: ", pod_ids);
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

    console.log("pods: ", pod_ids);
  }, [state.user?.pods]);
  

  // let url = 'https://main-server.s3.us-west-1.amazonaws.com/pod-audio/16f035b0-c660-41d0-ac2a-6089e8e744f3.wav?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA36WXSAYK3JZVHAPD%2F20241030%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20241030T233432Z&X-Amz-Expires=300&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEAgaCXVzLXdlc3QtMSJHMEUCIF1cNHG8LhZ8F72xseRlWqnKgVeewjh8Ft4%2BgJSfksvjAiEAx4fnQrwrgrct5n8ig4EEOpxLWEf0TvyKnY7tEIFw0Mkq9QIIgf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARADGgw4MjE4NjQ1NjQyNDUiDBTs6%2BXaEAINMhz2VCrJApIFDUJvEhCR5K5nQqnUHIGTp7OhIbfUXtQ0%2FZpW9XbLZECSr7lyetd4F4RTjwr%2BEczmeIA7nmdo1c005nleJzu63f9xXjqDHCtf3wwmhrjUEnecFn3CUrBjiIucETpOsL3ktYAAvYr%2FhoJb3y90pEBjlCUVl4XGO836XsjQlnulX7GqD3uE%2FmcFN1cdBZxe%2BWJ2Q61v3P8j1R5XGWNo1dDE741m6nOMNsGwHf7AlwF7MglKpxOux5H%2FXH%2FzX9DhzCeDpLomzP883HkJtb8gNdH3P82V0b4I9hU8CMNH6aC%2FPag0XOXwpE36vhphbS5NVXj1Jv9BEIStr47HuDT%2FoxhdETW%2FguaIbQ0c9VDF3AULUqURl4Y4cO9%2FphDfFo6sokT05wLkpgAbJQnBWt%2FTt44EVdo6LGmpLKx31XJZZ1Zap8RrEqSOieZPMPuEi7kGOrMC83%2BbWXDKKdrED0EnNIBw2EI%2BpskSAB0p%2F7qWXFFSHGR9Ns6K7rKz1bZfAOy6mCGElYg%2F04UGq9ejaWVMia0bCuees9SiBjaCcv0cCOkGDhvcUjN5D4lazpxY1hYPeApW0vPVYUkdR04XysP%2FRxdnH%2BLEZrw%2FkGtkKegI8nMpG2VykhcLBWS%2FByfnVx6KzwC10%2BmSNr9fin7V5G7vyAoLudO%2Bfdf7aOSmBbnXwzxA2QikNsb0cQCwrgSNPok1JMXeqMRt9ZFC5qfWjMGrSqxn85%2F7yuzZsqIL3lng6G%2B%2Bm3MVeaIoQWr1UAwz9BRGDGC00d4184ukkYVu%2FtQ9JI7RNyirWIlbbxqZvUcZcJxJfHw6vlCoIRxjiJ8GXbX%2FnYnJb%2FqB5o9DXyIX0Zjwtu%2BFPVXgpg%3D%3D&X-Amz-Signature=7a3306fea3ebcc4a218cdcdc90ff6dcc88f470cab3510603ad2456a251c10c58&X-Amz-SignedHeaders=host&response-content-disposition=inline';
  // SoundPlayer.playUrl(url)

  const handlePodClick = (pod: Pod) => {
    console.log("pod clicked: ", pod);
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
                        // onRequestClose={() => setIsPlayerModalVisible(false)}
                    >
                        <View style={styles.modalContainer} {...panResponder.panHandlers}>
                            <View style={styles.modalContent}>
                                <View style={styles.dragIndicator} />
                                <PodPlayer pod={currentPod ?? null} />
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      height: '90%',
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
