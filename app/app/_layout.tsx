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
import { AttemptAuthentication } from '@/scripts/auth';
import { ActivityIndicator, View } from 'react-native';
import { connectSocket, socket } from '@/scripts/socket';
import { env } from '@/config/env';
import { Colors } from '@/constants/Colors';
import { initMixpanel } from '@/scripts/mixpanel';
import * as SecureStore from 'expo-secure-store';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

function AppContent() {
  const { user: auth0_user, getCredentials, clearSession, hasValidCredentials } = useAuth0();
  const { state, dispatch } = useStateContext();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  useEffect(() => {
    async function init() {
      // setup socket and mixpanel
      connectSocket();
      initMixpanel();
      // checking to see if the user is already logged in
      let credentials = await getCredentials();
      if (credentials == null) {
        console.log('no valid credentials')
        setIsLoading(false);
      } else {
        console.log('has valid credentials')
        await SecureStore.setItemAsync('auth0AccessToken', credentials.accessToken);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loginStatus() {
      if (auth0_user != null && !isAuthenticating) {
        console.log('auth0_user', auth0_user)
        setIsAuthenticating(true);
        let storageCredentials = await SecureStore.getItemAsync('auth0AccessToken');
        if(storageCredentials == null) {
          let newCredentials = await getCredentials();
          if(newCredentials == null) {
            throw new Error('No credentials found in server');
          }
          await SecureStore.setItemAsync('auth0AccessToken', newCredentials.accessToken);
        }
        console.log('attempting authentication')
        await AttemptAuthentication(auth0_user, dispatch);
        setIsAuthenticating(false);
        setIsLoading(false);
      }
    }
    loginStatus()
  }, [auth0_user])

  useEffect(() => {
    // Only hide splash screen once app is fully ready
    async function hideSplash() {
      if (!isLoading) {
        await SplashScreen.hideAsync();
      }
    }

    hideSplash();
  }, [isLoading]);

  useEffect(() => {
    console.log("State changed for user login status:", state.isLoggedIn);
    setIsLoggedIn(state.isLoggedIn);
  }, [state]);

  if (isLoading) {
    return <ActivityIndicator size="large" color={Colors.theme.lightBlue} />;
  }

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
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
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