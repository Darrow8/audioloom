import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import Landing from './landing';
import { Auth0Provider, Credentials, LocalAuthenticationStrategy, useAuth0 } from 'react-native-auth0';
import { User } from '@shared/user';
import { useStateContext } from '@/state/StateContext';
import { StateProvider } from '@/state/StateContext';
import { checkLogin, initUser } from '@/scripts/auth';
import { ActivityIndicator, View } from 'react-native';
import { connectSocket, socket } from '@/scripts/socket';
import { env } from '@/config/env';
import { Colors } from '@/constants/Colors';
import { initMixpanel } from '@/scripts/mixpanel';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
  console.log('error preventing auto hide');
});

function AppContent() {
  const { user: auth0_user, getCredentials, clearSession, hasValidCredentials } = useAuth0();
  const { state, dispatch } = useStateContext();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
 

  useEffect(() => {
    async function init(){
      try{
        connectSocket();
        initMixpanel();
        console.log('auth0_user', auth0_user);
        let credentials = await getCredentials();
        if(credentials != undefined && auth0_user != null){
          await handleCheckLogin(auth0_user, credentials);
        }else{
          setIsLoading(false);
        }
      } catch(error) {
        console.error("Error initializing:", error);
        setIsLoading(false);
      }
    }
    init();
  }, []);

  async function handleCheckLogin(auth0_user: Partial<User>, credentials: Credentials) {
    try {
      if (credentials) {
        console.log('auth0_user', auth0_user);
        let resp = await checkLogin(auth0_user, dispatch, credentials);
        if (resp) {
          setIsLoggedIn(true);
        } else {
          clearSession();
          setIsLoggedIn(false);
        }
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      clearSession();
      setIsLoggedIn(false);
    }
  }

  useEffect(() => {
    console.log("State changed for user login status:", state.isLoggedIn);
    setIsLoggedIn(state.isLoggedIn);
  }, [state]);


  return (
    isLoggedIn ? (
      <Stack screenOptions={{
        headerStyle: {
          backgroundColor: Colors.theme.lightBlue,
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
  // const colorScheme = useColorScheme();
  // const [loaded, error] = useFonts({
  //   FuturaHeavy: require('../assets/fonts/futura/Futura_Heavy_font.ttf'),
  //   FuturaBook: require('../assets/fonts/futura/Futura_Book_font.ttf'),
  //   FuturaLight: require('../assets/fonts/futura/Futura_Light_font.ttf'),
  //   FuturaBold: require('../assets/fonts/futura/Futura_Bold_font.ttf'),
  //   FuturaExtraBlack: require('../assets/fonts/futura/Futura_Extra_Black_font.ttf'),
  //   FuturaBoldItalic: require('../assets/fonts/futura/Futura_Bold_Italic_font.ttf'),
  //   FuturaBookItalic: require('../assets/fonts/futura/Futura_Book_Italic_font.ttf'),
  //   FuturaHeavyItalic: require('../assets/fonts/futura/Futura_Heavy_Italic_font.ttf'),
  //   FuturaLightItalic: require('../assets/fonts/futura/Futura_Light_Italic_font.ttf'),
  //   FuturaMediumItalic: require('../assets/fonts/futura/Futura_Medium_Italic_font.ttf'),
  //   FuturaMediumBold: require('../assets/fonts/futura/futura_medium_bt.ttf'),
  // });


  // if(error){
  //   console.error("Error loading fonts:", error);
  // }
  // if (!loaded) {
  //   return <ActivityIndicator size="large" color="#0000ff" />;
  // }

  if (!env.AUTH0_DOMAIN || !env.AUTH0_CLIENT_ID) {
    throw new Error('No AUTH0_DOMAIN or AUTH0_CLIENT_ID available');
  }

  return (
    <Auth0Provider domain={env.AUTH0_DOMAIN} clientId={env.AUTH0_CLIENT_ID}>
      <StateProvider>
        <AppContent />
      </StateProvider>
    </Auth0Provider>
  );
}