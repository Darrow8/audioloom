import { registerRootComponent } from 'expo';
import { LogBox, YellowBox } from 'react-native';

import App from './App';


// this code is to suppress warning and errors
// Disable yellow warnings
LogBox.ignoreAllLogs();

// For older RN versions that still use YellowBox
if (YellowBox) {
  YellowBox.ignoreAllWarnings();
}

// Disable red error boxes
if (__DEV__) {
  // Only in development
  console.error = () => {};
} else {
  // In production
  console.error = () => {};
  console.warn = () => {};
  console.log = () => {};
}

// Alternative method to completely override error handling
ErrorUtils.setGlobalHandler(() => {
  // You can add custom error handling here if needed
});

// TrackPlayer.registerPlaybackService(() => require('./playerService'));


// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
