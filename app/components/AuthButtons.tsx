import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import auth0, { useAuth0, Auth0Provider } from 'react-native-auth0';
import WebAuth from 'react-native-auth0/lib/typescript/src/webauth';
import { getUserById, createUser } from '../scripts/mongoClient';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash';

const AuthButtons = () => {
  const { authorize, isLoading, user } = useAuth0();

  if (isLoading) {
    return <View><Text>Loading...</Text></View>;
  }

  const debouncedLogin = debounce(async () => {
    try {
      await authorize({
        scope: 'openid profile email',
        additionalParameters: {
          prompt: 'select_account',
          screen_hint: 'login'
        }
      });
    } catch (e) {
      console.log(e);
    }
  }, 1000);

  const debouncedSignup = debounce(async () => {
    try {
      await authorize({
        scope: 'openid profile email',
        additionalParameters: {
          prompt: 'select_account',
          screen_hint: 'signup'
        }
      });
      await SecureStore.setItemAsync('signingUp', 'true');
    } catch (e) {
      console.log(e);
    }
  }, 1000);

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button} onPress={debouncedLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={debouncedSignup}>
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

export default AuthButtons;