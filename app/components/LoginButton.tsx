import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Auth0 from 'react-native-auth0';
import auth0, { useAuth0, Auth0Provider } from 'react-native-auth0';

import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';


const LoginButton = () => {
  const { authorize, clearSession, isLoading } = useAuth0();


  if (isLoading) {
    return <View><Text>Loading...</Text></View>;
  }

  const onLogin = async () => {
    try {
      let credentials = await authorize();
      console.log("credentials: ", credentials);
      if (credentials && credentials.accessToken) {
        await SecureStore.setItemAsync('auth0AccessToken', credentials.accessToken);
        console.log('Access Token stored securely from LoginButton.tsx');
        // You can now use this access token for authenticated API requests
      }
    } catch (e) {
      console.log(e);
    }
  };


  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button} onPress={onLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onLogin}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 10,
    marginVertical: 1,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'FuturaMediumBold',
  }
});

export default LoginButton;