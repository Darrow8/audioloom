import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { AntDesign, Entypo, MaterialIcons } from '@expo/vector-icons';
import { Pod } from '@shared/pods';
import { getAudioFromS3 } from '@/scripts/s3';
import { AudioUrlTransporter } from '@shared/s3';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

const PodPlayer = ({ pod }: { pod: Pod | null }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(3600);
  const [audioUrlData, setAudioUrlData] = useState<AudioUrlTransporter | null>(null);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound>();
  const [isPlaying, setIsPlaying] = useState(false);

  if (pod == null) {
    return null;
  }

  useEffect(() => {
    if (pod.audio_key != '') {
      getAudioFromS3(pod.audio_key).then((data: AudioUrlTransporter) => {
        setAudioUrlData(data);
      });
    }
  }, [pod]);

  useEffect(() => {
    let subscription: any;
    if (audioUrlData) {
      loadAudio().then((sub) => {
        subscription = sub;
      });
    }
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [audioUrlData]);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.error('Error setting up audio mode:', err);
      }
    };

    setupAudio();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrlData?.audio_url ?? '' },
        { shouldPlay: false }
      );

      const statusSubscription = newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setCurrentTime(status.positionMillis / 1000);
          setDuration(status.durationMillis ? status.durationMillis / 1000 : duration);
        }
      });

      setSound(newSound);
      setIsLoading(false);

      return statusSubscription;
    } catch (err) {
      setError('Failed to load audio');
      setIsLoading(false);
      console.error('Error loading audio:', err);
    }
  };

  const playSound = async () => {
    try {
      if (!sound) {
        await loadAudio();
      }
      if(sound) {

      await sound.playAsync();
        setIsPlaying(true);
      }else{
        setError('Failed to play audio');
      }
    } catch (err) {
      setError('Failed to play audio');
      console.error('Error playing audio:', err);
    }
  };

  const pauseSound = async () => {
    try {
      await sound?.pauseAsync();
      setIsPlaying(false);
    } catch (err) {
      setError('Failed to pause audio');
      console.error('Error pausing audio:', err);
    }
  };


  const handlePlaybackProgress = async (value: number) => {
    try {
      setCurrentTime(value);
      if (sound) {
        await sound.setPositionAsync(value * 1000); // Convert seconds to milliseconds
      }
    } catch (err) {
      setError('Failed to seek audio');
      console.error('Error seeking audio:', err);
    }
  };

  const skipForward = async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          const newPosition = Math.min(status.positionMillis + 30000, status.durationMillis || 0);
          await sound.setPositionAsync(newPosition);
        }
      }
    } catch (err) {
      setError('Failed to skip forward');
      console.error('Error skipping forward:', err);
    }
  };

  const skipBackward = async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          const newPosition = Math.max(0, status.positionMillis - 30000);
          await sound.setPositionAsync(newPosition);
        }
      }
    } catch (err) {
      setError('Failed to skip backward');
      console.error('Error skipping backward:', err);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.centerContent}>
          <Text>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.podcastTitle}>{pod.title}</Text>
            <Text style={styles.podcastDescription}>
              {pod.author}
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
              <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
                <MaterialIcons name="replay-30" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={isPlaying ? pauseSound : playSound}>
                {isPlaying ? 
                  <AntDesign name="pause" size={24} color="#007AFF" /> 
                : 
                  <Entypo name="controller-play" size={24} color="#007AFF" />
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={skipForward}>
                <MaterialIcons name="forward-30" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    height: '100%',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  podcastCover: {
    width: 150,
    height: 150,
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
    // backgroundColor: '#f8f9fa',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  progressBar: {
    // marginVertical: 16,
    height: 40,
    paddingTop: 5,
    paddingBottom: 5,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  controlButton: {
    marginHorizontal: 24,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#dc3545',  // red color for error
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PodPlayer;