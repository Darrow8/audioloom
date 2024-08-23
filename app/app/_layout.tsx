import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as config from "../auth0_config";
import Landing from './landing';
import { Auth0Provider, useAuth0 } from 'react-native-auth0';
import { Linking, Alert } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { user } = useAuth0();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkLogin() {
      try {
        if (user) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    }
    checkLogin();
  }, [user]);
  return isLoggedIn ? (
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
  );
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
      <AppContent />
    </Auth0Provider>
  );
}
