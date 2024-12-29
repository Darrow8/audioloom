import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
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
import { Colors } from '@/constants/Colors';
import { skipBackward, skipForward, pauseSound, playSound, handlePlaybackProgress, setupPlayer, loadTrack } from '@/scripts/player';

const PodPlayer = ({ pod }: { pod: Pod }) => {
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const { position, duration } = useProgress();
  const playbackState = usePlaybackState();
  const { state } = useStateContext();

  if (pod == null) {
    return null;
  }

  useEffect(() => {
    let uid = state.user?._id.toString();
    if (uid) {
      (async () => {
        if (!playerInitialized) {
          console.log('running setup player!', playbackState.state);
          await setupPlayer(pod, uid);
          setPlayerInitialized(true);
        }
        console.log('pod', pod);
        console.log('playbackState', playbackState.state);
        await TrackPlayer.setQueue([]);

        await loadTrack(pod, uid);
      })();
    }
  }, [pod]);


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.podcastTitle}>{pod.title}</Text>
        {(pod.author && pod.author !== "Unknown" && pod.author !== "unknown") && (
          <Text numberOfLines={1} style={styles.podcastAuthor}>{pod.author}</Text>
        )}
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
          minimumTrackTintColor={Colors.theme.lightBlue}
          thumbTintColor={Colors.theme.lightBlue}
        />
        <View style={styles.controlButtons}>
          <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
            <MaterialIcons name="replay-30" size={24} color={Colors.theme.lightBlue} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={playbackState.state == State.Playing ? pauseSound : playSound}>
            {playbackState.state == State.Playing ? (
              <AntDesign name="pause" size={24} color={Colors.theme.lightBlue} />
            ) : (playbackState.state == State.Paused || playbackState.state == State.Ready) ? (
              <Entypo name="controller-play" size={24} color={Colors.theme.lightBlue} />
            ) : (playbackState.state == State.Buffering || playbackState.state == State.Loading) ? (
              <ActivityIndicator size="small" color={Colors.theme.lightBlue} />
            ) : (
              <ActivityIndicator size="small" color={Colors.theme.lightBlue} />
            )
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={skipForward}>
            <MaterialIcons name="forward-30" size={24} color={Colors.theme.lightBlue} />
          </TouchableOpacity>
        </View>
      </View>
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