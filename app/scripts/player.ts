import TrackPlayer, {
  useTrackPlayerEvents,
  Event,
  State,
  useProgress,
  usePlaybackState,
  Capability,
  PlaybackState
} from 'react-native-track-player';
import { getAudioFromS3 } from './s3';
import { Pod } from '@shared/pods';
import { AudioUrlTransporter } from '@shared/s3';
import { trackEvent } from '@/scripts/mixpanel';
import { useStateContext } from '@/state/StateContext';

let isPlayerInitialized = false;

export const setupPlayer = async (pod: Pod, user_id: string) => {
  try {
    if (isPlayerInitialized) {
      await TrackPlayer.reset();
    }
    await TrackPlayer.setupPlayer()
    isPlayerInitialized = true;
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
    TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.pause();
    });
  } catch (error) {
    console.log('Error setting up player:', error);
  }
}

export const loadTrack = async (pod: Pod, user_id: string) => {
  console.log('loadTrack', pod);
  await getAudioFromS3(pod.audio_key).then(async (data: AudioUrlTransporter) => {
    await TrackPlayer.add({
      url: data.audio_url,
      title: pod.title,
      artist: pod.author,
      id: pod._id,
    });
    trackEvent('pod_play', {
      pod_id: pod._id,
      pod_title: pod.title,
      pod_author: pod.author,
      listener_id: user_id,
    });
    await TrackPlayer.play();
  })
}

//   export async function initPlayer(pod: Pod, user_id: string, playbackState: PlaybackState) {
//     if (playbackState.state == State.None || playbackState.state == undefined) {
//       await setupPlayer(pod, user_id);
//     }
//   }



export const playSound = async () => {
  try {
    await TrackPlayer.play();
  } catch (error) {
    console.error('Error playing track:', error);
    //   setError('Failed to play audio');
  }
};

export const pauseSound = async () => {
  try {
    await TrackPlayer.pause();
  } catch (error) {
    console.error('Error pausing track:', error);
    //   setError('Failed to pause audio');
  }
};

export const handlePlaybackProgress = async (value: number) => {
  try {
    await TrackPlayer.seekTo(value);
  } catch (error) {
    console.error('Error seeking:', error);
  }
};

export const skipForward = async () => {
  try {
    await TrackPlayer.seekBy(30);
  } catch (error) {
    console.error('Error skipping forward:', error);
  }
};

export const skipBackward = async () => {
  try {
    await TrackPlayer.seekBy(-30);
  } catch (error) {
    console.error('Error skipping backward:', error);
  }
};