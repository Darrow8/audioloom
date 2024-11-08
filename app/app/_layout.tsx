import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as config from "../auth0_config";
import Landing from './landing';
import { Auth0Provider, useAuth0 } from 'react-native-auth0';
import * as SecureStore from 'expo-secure-store';
import { getUserBySub, watchDocumentUser } from '../scripts/mongoClient';
import { User } from '@/scripts/user';
import { useStateContext } from '@/state/StateContext';
import { StateProvider } from '@/state/StateContext';
import { initUser, userStateCheck } from '@/scripts/auth';
import { ActivityIndicator, View } from 'react-native';
import { socket } from '@/scripts/socket';
import { MongoChangeStreamData } from '@shared/index';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();


function AppContent() {
  const { user: auth0_user, getCredentials,clearSession, clearCredentials, hasValidCredentials } = useAuth0();
  const { state, dispatch } = useStateContext();
  const [isLoading, setIsLoading] = useState(true);




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


  const localWatchUser = (mongo_user: User) => {
    watchDocumentUser(mongo_user._id, (data: MongoChangeStreamData) => {
      if (data.operationType === 'update') {
        // update user state with the full document
        dispatch({ type: 'UPDATE_USER', payload: data.fullDocument as Partial<User> });
      }
    });
  }
  

  // check if user is logged in at start of app
  useEffect(() => {
    async function checkLogin() {
      try {
        setIsLoading(true);
        if (auth0_user) {
          const credentials = await getCredentials();
          if (credentials && credentials.accessToken) {
            await SecureStore.setItemAsync('auth0AccessToken', credentials.accessToken);
            // get user from mongo
            let mongo_user = await getUserBySub(auth0_user.sub);
            if (mongo_user != undefined && mongo_user != false) {
              // watch user
              localWatchUser(mongo_user);
              dispatch({ type: 'LOGIN', payload: mongo_user });
            }else{
              if (auth0_user.email && auth0_user.name) {
                // make new user
                let new_user = await initUser(auth0_user);
                // watch user
                localWatchUser(new_user);
                dispatch({ type: 'LOGIN', payload: new_user });
              }else{
                throw new Error('User email and name are required');
              }
            }
          } else {
            throw new Error('Error getting credentials');
          }
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        // full sign out
        await SecureStore.deleteItemAsync('auth0AccessToken');
        dispatch({ type: 'LOGOUT' });
        clearCredentials();
        clearSession();
        console.log("User logged out");
        // // temporary fix for logout
        // window.location.reload();
      } finally {
        setIsLoading(false);
      }
    }
    checkLogin();
  }, [auth0_user, hasValidCredentials]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    state.isLoggedIn ? (
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