// web 554636964216-9q9lctjgnrbjvgs9276nn0e3l7hdm6ce.apps.googleusercontent.com
// ios 554636964216-v3fsfvau5939st9bjquk8to2fnt0m2f1.apps.googleusercontent.com
import * as React from 'react';
import { View, Button, Text } from 'react-native';
import * as web from 'expo-web-browser';
import * as google from 'expo-auth-session/providers/google'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import {googleLogout} from './Logout';

import {useAuthStore, getLocalUser} from '@/user-store';

web.maybeCompleteAuthSession();


export default function GoogleLoginButton(){
  const [token, setToken] = React.useState("");

  const [request, response, promptAsync] = google.useAuthRequest({
    iosClientId: "554636964216-v3fsfvau5939st9bjquk8to2fnt0m2f1.apps.googleusercontent.com",
    webClientId: "554636964216-9q9lctjgnrbjvgs9276nn0e3l7hdm6ce.apps.googleusercontent.com "
  }); 

  React.useEffect(() => {
    handleSignIn();
  }, [response, token]);

  async function handleSignIn(){
    try{
    const user = await getLocalUser();
    if(!user){
      if(response?.type == 'success'){
        
        await getUserInfo(response.authentication?.accessToken);
      }else{
          await googleLogout();
      }
    } else {
      useAuthStore.setState({user:user});      
    }
  }catch(error){
    console.error('signInError', error)
  }
  }

  const getUserInfo = async (token: string | undefined) => {
    if (!token) return;
    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const user = await response.json();
      await AsyncStorage.setItem("@user", JSON.stringify(user));
      await AsyncStorage.setItem("@token", token);
      useAuthStore.setState({user:user});
    } catch (error) {
      // Add your own error handler here
      console.log('AUTH ERROR', error);
    }
  };

  return (
    <View>
      <Button title="Sign in with Google" disabled={!request}
          onPress={() => {
            promptAsync();
          }} />
    </View>
  );
};

