// // https://rntp.dev/docs/basics/getting-started
// module.exports = async function() {
//     TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play());
//     TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause());
//     TrackPlayer.addEventListener('remote-next', () => TrackPlayer.skipToNext());
//     TrackPlayer.addEventListener('remote-previous', () => TrackPlayer.skipToPrevious());
//     TrackPlayer.addEventListener('remote-stop', () => TrackPlayer.destroy());
//     TrackPlayer.addEventListener('remote-seek', (event) => TrackPlayer.seekTo(event.position));
//     TrackPlayer.addEventListener('remote-jump-forward', () => TrackPlayer.seekBy(30));
//     TrackPlayer.addEventListener('remote-jump-backward', () => TrackPlayer.seekBy(-30));
//   };