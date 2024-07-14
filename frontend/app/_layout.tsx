import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, {useEffect, useState, useCallback} from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
// import GoogleLoginButton from '@/components/GoogleButton';
// import { AuthProvider, useFlow, useDescope, useSession } from '@descope/react-native-sdk'
// import {UserInfo, GoogleLoginButtonProps} from '@/user-store';
// import Logout from '@/components/Logout';
// import {useAuth0, Auth0Provider} from 'react-native-auth0';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // const {authorize, clearSession, user, error, isLoading} = useAuth0();
  // const store = useAuthStore(state => state.user);
  const colorScheme = useColorScheme();
  // console.log(store)
  
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

//   const onLogin = async () => {
//     try {
//       await authorize();
//     } catch (e) {
//       console.log(e);
//     }
//   };

//   const onLogout = async () => {
//     try {
//       await clearSession();
//     } catch (e) {
//       console.log('Log out cancelled');
//     }
//   };

//   // if (isLoading) {
//   //   return <View style={styles.container}><Text>Loading</Text></View>;
//   // }

//   const loggedIn = user !== undefined && user !== null;

//   return (
//     <Auth0Provider domain={"dev-r0ex85m18bf4us41.us.auth0.com"} clientId={"ueSw4GpPKdhKKmPvx6CVtgsZfrhwmcrw"}>

//     <View style={styles.container}>
//       {loggedIn && <Text>You are logged in as {user.name}</Text>}
//       {!loggedIn && <Text>You are not logged in</Text>}
//       {error && <Text>{error.message}</Text>}

//       <Button
//         onPress={loggedIn ? onLogout : onLogin}
//         title={loggedIn ? 'Log Out' : 'Log In'}
//       />
//     </View>
//     </Auth0Provider>
//   );
// }
  return (
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  }
});



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