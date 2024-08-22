import React, { useState } from 'react';
import { Modal, StyleSheet, View, ScrollView } from 'react-native';
import UploadButton from '../../components/UploadButton';
import PodComponent, { Pod, Status } from '../../components/Pod';
import PodPlayer from '@/components/PodPlayer';
import Upload from '@/components/upload';

const Listen: React.FC = () => {
  const [playerVisible, setPlayerVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);

  const pods: Pod[] = [
    {
      id: '1',
      title: 'Title 1',
      artist: 'Artist 1',
      coverImage: 'https://via.placeholder.com/150',
      status: Status.READY,
    },
    {
      id: '2',
      title: 'Title 2',
      artist: 'Artist 2',
      coverImage: 'https://via.placeholder.com/150',
      status: Status.READY,
    },    
    {
      id: '3',
      title: 'Title 3',
      artist: 'Artist 3',
      coverImage: 'https://via.placeholder.com/150',
      status: Status.READY,
    },
    {
      id: '4',
      title: 'Title 4',
      artist: 'Artist 4',
      coverImage: 'https://via.placeholder.com/150',
      status: Status.READY,
    },
    {
      id: '5',
      title: 'Title 5',
      artist: 'Artist 5',
      coverImage: 'https://via.placeholder.com/150',
      status: Status.READY,
    },
    {
      id: '6',
      title: 'Title 6',
      artist: 'Artist 6',
      coverImage: 'https://via.placeholder.com/150',
      status: Status.READY,
    },
    {
      id: '7',
      title: 'Title 7',
      artist: 'Artist 7',
      coverImage: 'https://via.placeholder.com/150',
      status: Status.READY,
    },
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
