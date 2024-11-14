import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as config from "../auth0_config";
import Landing from './landing';
import Auth0 from 'react-native-auth0';
import { Auth0Provider, useAuth0 } from 'react-native-auth0';
import { User } from '@shared/user';
import { useStateContext } from '@/state/StateContext';
import { StateProvider } from '@/state/StateContext';
import { checkLogin, initUser } from '@/scripts/auth';
import { ActivityIndicator, View } from 'react-native';
import { socket } from '@/scripts/socket';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { user: auth0_user, getCredentials,clearSession, clearCredentials, hasValidCredentials } = useAuth0();
  const { state, dispatch } = useStateContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const handleConnect = () => {
      console.log('Connected to socket server');
    };

    const handleDisconnect = (reason: string) => {
      console.log('Disconnected:', reason);
    };

    const handleError = (err: Error) => {
      console.error('Socket error:', err);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);
  }, []);
  
  async function handleCheckLogin(auth0_user: Partial<User>){
    let credentials = await getCredentials();
    if(credentials){
      let resp = await checkLogin(auth0_user, dispatch, credentials);
      setIsLoading(false);
      if(resp){
        setIsLoggedIn(true);
      }else{
        setIsLoggedIn(false);
      }
    }
  }


  // check if user is logged in at start of app
  useEffect(() => {
    if(auth0_user){
      handleCheckLogin(auth0_user);
    }else{
      setIsLoading(false);
    }
  }, [auth0_user]);

  useEffect(() => {
    console.log("State changed for user login status:", state.isLoggedIn);
    setIsLoggedIn(state.isLoggedIn);
  }, [state]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    isLoggedIn ? (
      <Stack screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShown: false
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    ) : (
      <Landing />
    )
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    FuturaHeavy: require('../assets/fonts/futura/Futura_Heavy_font.ttf'),
    FuturaBook: require('../assets/fonts/futura/Futura_Book_font.ttf'),
    FuturaLight: require('../assets/fonts/futura/Futura_Light_font.ttf'),
    FuturaBold: require('../assets/fonts/futura/Futura_Bold_font.ttf'),
    FuturaExtraBlack: require('../assets/fonts/futura/Futura_Extra_Black_font.ttf'),
    FuturaBoldItalic: require('../assets/fonts/futura/Futura_Bold_Italic_font.ttf'),
    FuturaBookItalic: require('../assets/fonts/futura/Futura_Book_Italic_font.ttf'),
    FuturaHeavyItalic: require('../assets/fonts/futura/Futura_Heavy_Italic_font.ttf'),
    FuturaLightItalic: require('../assets/fonts/futura/Futura_Light_Italic_font.ttf'),
    FuturaMediumItalic: require('../assets/fonts/futura/Futura_Medium_Italic_font.ttf'),
    FuturaMediumBold: require('../assets/fonts/futura/futura_medium_bt.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Auth0Provider domain={config.default.domain} clientId={config.default.clientId}>
      <StateProvider>
        <AppContent />
      </StateProvider>
    </Auth0Provider>
  );
}