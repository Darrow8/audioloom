import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '554636964216-9q9lctjgnrbjvgs9276nn0e3l7hdm6ce.apps.googleusercontent.com', // From Google Cloud Console
});

export default GoogleSignin;
