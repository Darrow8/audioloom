import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { AntDesign, Entypo, MaterialIcons } from '@expo/vector-icons';
import { Pod } from '@shared/pods';
import { getAudioFromS3 } from '@/scripts/s3';
import { AudioUrlTransporter } from '@shared/s3';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Marquee } from '@animatereactnative/marquee';
import { trackEvent } from '@/scripts/mixpanel';
import { useStateContext } from '@/state/StateContext';
import TrackPlayer, { 
  useTrackPlayerEvents,
  Event,
  State,
  useProgress,
  usePlaybackState,
  Capability
} from 'react-native-track-player';


const PodPlayer = ({ pod, sound, setSound }: { pod: Pod | null, sound: Audio.Sound | undefined, setSound: (sound: Audio.Sound | undefined) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrlData, setAudioUrlData] = useState<AudioUrlTransporter | null>(null);
  const { position, duration } = useProgress();
  const playbackState = usePlaybackState();
  const isPlaying = playbackState.state === State.Playing;
  const { state } = useStateContext();

  if (pod == null) {
    return null;
  }
  

  const setupPlayer = async () => {
    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SeekTo,
          Capability.JumpForward,
          Capability.JumpBackward,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
        ],
      });
      TrackPlayer.addEventListener(Event.RemotePlay, async () => {
        await TrackPlayer.play();
      });
  
      TrackPlayer.addEventListener(Event.RemotePause, async () => {
        await TrackPlayer.pause();
      });
  
      TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
        await TrackPlayer.seekTo(event.position);
      });
  
      TrackPlayer.addEventListener(Event.RemoteJumpForward, async () => {
        await TrackPlayer.seekBy(30);
      });
  
      TrackPlayer.addEventListener(Event.RemoteJumpBackward, async () => {
        await TrackPlayer.seekBy(-30);
      });
    } catch (error) {
      console.error('Error setting up player:', error);
    }
  };

  async function initPlayer() { 
    let playerState = await TrackPlayer.getPlaybackState();
    if(playerState.state == State.None) {
      await setupPlayer();
    }
    // if(playerState.state == State.Paused || playerState.state == State.Ready) {
    //   await TrackPlayer.play();
    // }
  }

  useEffect(() => {
    initPlayer();
  }, []);

  useEffect(() => {
    if (pod.audio_key != '') {
      getAudioFromS3(pod.audio_key).then((data: AudioUrlTransporter) => {
        setAudioUrlData(data);
        loadTrack(data.audio_url);
        trackEvent('pod_play', {
          pod_id: pod._id,
          pod_title: pod.title,
          pod_author: pod.author,
          listener_id: state.user?._id,
        });
      }).catch((error) => {
        console.error('Error getting audio from S3:', error);
        setError('Failed to load audio');
      });
    }
  }, [pod]);

  const loadTrack = async (audioUrl: string) => {
    try {
      setIsLoading(true);
      await TrackPlayer.reset();
      await TrackPlayer.add({
        url: audioUrl,
        title: pod.title,
        artist: pod.author,
        id: pod._id,
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading track:', error);
      setError('Failed to load audio');
      setIsLoading(false);
    }
  };

  const playSound = async () => {
    try {
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error playing track:', error);
      setError('Failed to play audio');
    }
  };

  const pauseSound = async () => {
    try {
      await TrackPlayer.pause();
    } catch (error) {
      console.error('Error pausing track:', error);
      setError('Failed to pause audio');
    }
  };

  const handlePlaybackProgress = async (value: number) => {
    try {
      await TrackPlayer.seekTo(value);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const skipForward = async () => {
    try {
      await TrackPlayer.seekBy(30);
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };

  const skipBackward = async () => {
    try {
      await TrackPlayer.seekBy(-30);
    } catch (error) {
      console.error('Error skipping backward:', error);
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
            {/* <Marquee
              speed={0.5}
              spacing={2}> */}
             <Text numberOfLines={1} style={styles.podcastTitle}>{pod.title}</Text>
            {/* </Marquee>
            <Marquee
              speed={0.5}
              spacing={2}> */}
              {(pod.author && pod.author !== "Unknown" && pod.author !== "unknown") && (
                <Text numberOfLines={1} style={styles.podcastAuthor}>{pod.author}</Text>
              )}
            {/* </Marquee> */}
          </View>

          <View style={styles.controls}>
            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
            <Slider
              style={styles.progressBar}
              minimumValue={0}
              maximumValue={duration}
              value={position}
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
  podcastAuthor: {
    fontSize: 16,
    fontWeight: 'regular',
    marginBottom: 0,
    color: '#666',
  },
  controls: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16
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