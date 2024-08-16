import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, {useEffect, useState, useCallback} from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Appearance, useColorScheme } from 'react-native';
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
    FuturaHeavy: require('../assets/fonts/futura/Futura_Heavy_font.ttf'),
    FuturaBook: require('../assets/fonts/futura/Futura_Book_font.ttf'),
    FuturaLight: require('../assets/fonts/futura/Futura_Light_font.ttf'),
    // FuturaMedium: require('../assets/fonts/futura/Futura_Medium_font.ttf'),
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