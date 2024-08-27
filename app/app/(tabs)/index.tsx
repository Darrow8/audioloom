import React, { useState } from 'react';
import { Modal, StyleSheet, View, ScrollView } from 'react-native';
import UploadButton from '../../components/UploadButton';
import PodComponent, { Pod, Status } from '../../components/Pod';
import PodPlayer from '@/components/PodPlayer';
import Upload from '@/components/upload';
// import * as mongo from '@/scripts/mongoClient';
// import * as SecureStore from 'expo-secure-store';

const Listen: React.FC = () => {
  const [playerVisible, setPlayerVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);


  async function testCall(){
    try {
      const response = await fetch('https://10.0.2.2:3000/public')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetch response:', data);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

  testCall();

  const pods: Pod[] = [
    {
      id: '1',
      title: 'Title 1',
      artist: 'Artist 1',
      coverImage: 'https://via.placeholder.com/150',
      status: Status.READY,
    }
  ];

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={playerVisible}
        onRequestClose={() => {
          setPlayerVisible(!playerVisible);
        }}>
        <PodPlayer />
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={uploadVisible} 
        onRequestClose={() => {
          setUploadVisible(!uploadVisible);
        }}>
          <Upload />
      </Modal>
      <ScrollView contentContainerStyle={styles.songList}>
        {pods.map((song) => (
          <PodComponent key={song.id} pod={song}/>
        ))}
      </ScrollView>
      <UploadButton />
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