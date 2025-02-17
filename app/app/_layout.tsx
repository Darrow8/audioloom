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
import { ToastProvider } from '@/state/ToastContext';
import * as Sentry from '@sentry/react-native';
import { StatusBar } from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { initOneSignal, logoutOneSignal, requestNotificationPermission } from '@/scripts/onesignal';
import { PlaybackProvider } from '@/state/PlaybackContext';
import { StripeProvider } from '@stripe/stripe-react-native';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

// initialize sentry
Sentry.init({
  dsn: "https://3bc4ce3723844cff3747952612e59cee@o4508561138712576.ingest.us.sentry.io/4508561140154368",
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
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
      console.log('on init')
      connectSocket();
      initMixpanel();
      initOneSignal();
      // test delete this later
      // requestNotificationPermission();
      StatusBar.setBarStyle('dark-content');
      // checking to see if the user is already logged in
      let cur_credentials = await SecureStore.getItemAsync('auth0AccessToken');
      let cred_status = await hasValidCredentials();
      if (cur_credentials == null && cred_status == false) {
        console.log('no credentials saved')
        setIsLoading(false);
      }
      else if (cur_credentials == null || cred_status == false) {
        console.log('issue with credentials')
        let new_credentials = await getCredentials();
        console.log('new_credentials', new_credentials)
        if (new_credentials == null) {
          console.error('No credentials found in server');
          await SecureStore.deleteItemAsync('auth0AccessToken');
          clearSession();
          logoutOneSignal();
          setIsLoading(false);
        } else {
          // delete the old token and set the new token
          await SecureStore.deleteItemAsync('auth0AccessToken');
          await SecureStore.setItemAsync('auth0AccessToken', new_credentials.accessToken);
          let new_cred_status = await hasValidCredentials();
          if (new_cred_status == false) {
            await SecureStore.deleteItemAsync('auth0AccessToken');
            clearSession();
            logoutOneSignal();
            setIsLoading(false);
          }
        }
      }
    }
    init();
  }, []);

  useEffect(() => {
    const loginStatus = async () => {
      if (auth0_user != null && !isAuthenticating) {
        console.log('auth0_user', auth0_user)
        setIsAuthenticating(true);
        let storageCredentials = await SecureStore.getItemAsync('auth0AccessToken');
        console.log('storageCredentials', storageCredentials)
        if (storageCredentials == null) {
          let newCredentials = await getCredentials();
          if (newCredentials == null) {
            throw new Error('No credentials found in server');
          }
          await SecureStore.setItemAsync('auth0AccessToken', newCredentials.accessToken);
        }
        console.log('attempting authentication')
        let resp = await AttemptAuthentication(auth0_user, dispatch);
        if (resp == false) {
          console.log('Authentication failed, restarting app');
          await SecureStore.deleteItemAsync('auth0AccessToken');
          clearSession();
        }
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
    NotoSans: require('../assets/fonts/Noto_Sans/static/NotoSans-Regular.ttf'),
    NotoSansItalic: require('../assets/fonts/Noto_Sans/static/NotoSans-Italic.ttf'),
    NotoSansBold: require('../assets/fonts/Noto_Sans/static/NotoSans-Bold.ttf'),
    NotoSansBoldItalic: require('../assets/fonts/Noto_Sans/static/NotoSans-BoldItalic.ttf'),
  });

  if (!loaded) {
    return null;
  }
  if (!env.AUTH0_DOMAIN || !env.AUTH0_CLIENT_ID) {
    throw new Error('No AUTH0_DOMAIN or AUTH0_CLIENT_ID available');
  }

  return (
    <Auth0Provider domain={env.AUTH0_DOMAIN} clientId={env.AUTH0_CLIENT_ID}>
      <StripeProvider publishableKey="YOUR_PUBLISHABLE_KEY">
        <PlaybackProvider>
          <ActionSheetProvider>
            <StateProvider>
              <ToastProvider>
                <StatusBar barStyle="dark-content" />
                <AppContent />
              </ToastProvider>
            </StateProvider>
          </ActionSheetProvider>
        </PlaybackProvider>
      </StripeProvider>
    </Auth0Provider>
  );
}