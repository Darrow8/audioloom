import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import auth0, { useAuth0, Auth0Provider } from 'react-native-auth0';
import { getUserById, createUser } from '../scripts/mongoClient';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';


const LoginButton = () => {
  const { authorize, clearSession, isLoading,  } = useAuth0();


  if (isLoading) {
    return <View><Text>Loading...</Text></View>;
  }
  // when user clicks login, call auth0 to login
  const onLogin = async () => {
    try {
      await authorize({
        scope: 'openid profile email prompt:select_account'
      });
      
    } catch (e) {
      console.log(e);
    }
  };

  const onSignup = async () => {
    try {
      await authorize({
        scope: 'openid profile email prompt:select_account'
      });
      
    } catch (e) {
      console.log(e);
    }
  };


  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button} onPress={onLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onSignup}>
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