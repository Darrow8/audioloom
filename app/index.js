import { registerRootComponent } from 'expo';
import { LogBox, YellowBox } from 'react-native';
import App from './App';


// this code is to suppress warning and errors
// Disable yellow warnings if in production
if (process.env.NODE_ENV === 'production') {
  LogBox.ignoreAllLogs();
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
