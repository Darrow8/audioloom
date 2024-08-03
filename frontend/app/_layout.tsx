import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, {useEffect, useState, useCallback} from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import auth0, {useAuth0, Auth0Provider} from 'react-native-auth0';
// import Auth from './Auth';
import * as config from "../auth0_config";
import Landing from './landing';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const {authorize, clearSession, user, error} = useAuth0();

  const loggedIn = user !== undefined && user !== null;
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
        {loggedIn ? 
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
          <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
        </Stack>:
        <Landing />
        }
    </Auth0Provider>
  );
}