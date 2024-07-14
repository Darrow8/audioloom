import React from 'react'
import { View, Button, Text } from 'react-native';
import * as web from 'expo-web-browser';
import * as auth from 'expo-auth-session'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleLoginButtonProps, UserInfo } from '@/user-store';
import {useAuthStore} from '@/user-store';

export async function googleLogout(){
  const token = await AsyncStorage.getItem("@token");
  if (token) {
      try {
        await auth.revokeAsync({ token }, { revocationEndpoint: 'https://oauth2.googleapis.com/revoke' });
        await AsyncStorage.removeItem("@user");
        await AsyncStorage.removeItem("@token");
        useAuthStore.setState({user:null});
      } catch (error) {
        console.log('ERROR XXX', error)
      }
  }else{
    await AsyncStorage.removeItem("@user");
    useAuthStore.setState({user:null});
  }
  console.log('logged out');

}

function Logout() {

  return (
    <View>
    <Button title="Logout" onPress={()=>{googleLogout()}}></Button>
    </View>
)
}

export default Logout;
