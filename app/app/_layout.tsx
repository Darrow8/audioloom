import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as config from "../auth0_config";
import Landing from './landing';
import { Auth0Provider, useAuth0 } from 'react-native-auth0';
import * as SecureStore from 'expo-secure-store';
import { createUser, getAllUsers, getUser } from '../scripts/mongoClient';
import { User } from '@/scripts/user';
import { useStateContext } from '@/state/StateContext';
import { StateProvider } from '@/state/StateContext';
import { initUser, userStateCheck } from '@/scripts/auth';
import { ActivityIndicator, View } from 'react-native';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();


function AppContent() {
  const { user: auth0_user, getCredentials } = useAuth0();
  const { state, dispatch } = useStateContext();
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    async function checkLogin() {
      try {
        setIsLoading(true);
        if (auth0_user) {
          const credentials = await getCredentials();
          if (credentials && credentials.accessToken) {
            await SecureStore.setItemAsync('auth0AccessToken', credentials.accessToken);
            console.log('Access Token stored securely from _layout.tsx');
            let userId = (auth0_user.sub as string).split('|')[1];
            let mongo_user = await getUser(userId);
            if (mongo_user == undefined) {
              // create new user
              let new_user = await initUser(userId, auth0_user);
              if (new_user) {
                dispatch({ type: 'LOGIN', payload: new_user });
              } 
            } else {
              dispatch({ type: 'LOGIN', payload: mongo_user });
              await userStateCheck(mongo_user, auth0_user, dispatch);
            }
          } else {
            dispatch({ type: 'LOGOUT' });
            await SecureStore.deleteItemAsync('auth0AccessToken');
          }
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        await SecureStore.deleteItemAsync('auth0AccessToken');
        dispatch({ type: 'LOGOUT' });
      } finally {
        setIsLoading(false);
      }
    }
    checkLogin();
  }, [auth0_user, getCredentials]);

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

async function testPublic() {
  await fetch('https://api.rivetaudio.com/public')
    .then(response => response.text())
    .then(data => {
      console.log('Public data:', data);
    })
    .catch(error => {
      console.error('Error fetching public data:', error);
    });

}