import React, { useState } from 'react';
import { Modal, StyleSheet, View, ScrollView } from 'react-native';
import UploadButton from '../../components/UploadButton';
import PodComponent, { Pod, Status } from '../../components/Pod';
import PodPlayer from '@/components/PodPlayer';
import { useStateContext } from '@/state/StateContext';
// import * as mongo from '@/scripts/mongoClient';
// import * as SecureStore from 'expo-secure-store';

const Listen: React.FC = () => {
  const [uploadVisible, setUploadVisible] = useState(false);
  const { state } = useStateContext();

  const pods: Pod[] = [
    {
      id: '1',
      title: 'Title 1',
      artist: 'Artist 1',
      coverImage: 'https://via.placeholder.com/150',
      status: Status.READY,
    }
  ];


  if (state.user == null) {
    return <></>
  }

  return (
    <View style={styles.container}>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={uploadVisible} 
        onRequestClose={() => {
          setUploadVisible(!uploadVisible);
        }}>
      </Modal>
      <ScrollView contentContainerStyle={styles.songList}>
        {pods.map((song) => (
          <PodComponent key={song.id} pod={song}/>
        ))}
      </ScrollView>
      <UploadButton userId={state.user?._id}/>
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
});

export default Listen;