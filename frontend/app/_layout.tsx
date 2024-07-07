import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import 'react-native-reanimated';
import {Text, View} from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import GoogleLoginButton from '@/components/GoogleButton';

import {UserInfo, GoogleLoginButtonProps} from '@/user-store';
import Logout from '@/components/Logout';
import {useAuthStore, getLocalUser} from '@/user-store';
import Login from '@/app/login';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const store = useAuthStore(state => state.user);
  const colorScheme = useColorScheme();
  console.log(store)
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  React.useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }



  return (
      <View style={{ flex: 1 }}>
          {store ?
          
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{
                headerStyle: {
                  backgroundColor: '#f4511e',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}>
              <Stack.Screen name="(tabs)" options={{}} />
            </Stack>
          </ThemeProvider>        
          :
          <Login />
          }
      </View>
            );
}

   