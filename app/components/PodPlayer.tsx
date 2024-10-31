import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { AntDesign } from '@expo/vector-icons';
import { Pod } from './Pod';

const PodPlayer = ({pod}: {pod: Pod | null}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(3600);

  if (pod == null) {
    return <></>;
  }

  const handlePlaybackProgress = (value:number) => {
    setCurrentTime(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <Image
          source={{ uri: pod.coverImage }}
          style={styles.podcastCover}
        /> */}
        <Text style={styles.podcastTitle}>{pod.title}</Text>
        <Text style={styles.podcastDescription}>
          {/* {pod.description} */}
        </Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
        <Slider
          style={styles.progressBar}
          minimumValue={0}
          maximumValue={duration}
          value={currentTime}
          onValueChange={handlePlaybackProgress}
          maximumTrackTintColor="#ccc"
          minimumTrackTintColor="#007AFF"
          thumbTintColor="#007AFF"
        />
        <View style={styles.controlButtons}>
          <TouchableOpacity style={styles.controlButton}>
            <AntDesign name="stepbackward" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <AntDesign name="pause" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <AntDesign name="stepforward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const formatTime = (seconds:number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  podcastCover: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  podcastTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  podcastDescription: {
    fontSize: 16,
    color: '#666',
  },
  controls: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#666',
  },
  progressBar: {
    marginVertical: 16,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButton: {
    marginHorizontal: 16,
  },
});

export default PodPlayer;