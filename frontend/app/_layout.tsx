import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, {useEffect, useState, useCallback} from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import {useAuth0, Auth0Provider} from 'react-native-auth0';
import Auth from './Auth';
import * as config from "../auth0_config";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
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
    <Auth></Auth>
    </Auth0Provider>
  );
}
//   return (
//         <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//         <Stack screenOptions={{
//             headerStyle: {
//               backgroundColor: '#f4511e',
//             },
//             headerTintColor: '#fff',
//             headerTitleStyle: {
//               fontWeight: 'bold',
//             },
//           }}>
//           <Stack.Screen name="(tabs)" options={{}} />
//         </Stack>
//       </ThemeProvider>  
//   )
// }





        {/* <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
          </ThemeProvider>   */}
  // return (
  //     <View style={{ flex: 1 }}>
  //       <AuthProvider projectId="P2jAQE43qtYLGjgYtStfEnuojdmU">
  //           <DescopeAuth />

  //       </AuthProvider>
  //         {/* {store ?
          
  //         <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
  //           <Stack screenOptions={{
  //               headerStyle: {
  //                 backgroundColor: '#f4511e',
  //               },
  //               headerTintColor: '#fff',
  //               headerTitleStyle: {
  //                 fontWeight: 'bold',
  //               },
  //             }}>
  //             <Stack.Screen name="(tabs)" options={{}} />
  //           </Stack>
  //         </ThemeProvider>        
  //         :
  //         <Login />
  //         } */}
  //     </View>
  //           );