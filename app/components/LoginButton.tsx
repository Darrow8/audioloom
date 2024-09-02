import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Auth0 from 'react-native-auth0';
import auth0, { useAuth0, Auth0Provider } from 'react-native-auth0';
import { getUser, createUser } from '../scripts/mongoClient';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';
import { MongoUser } from '../scripts/user';
import { v4 as uuidv4 } from 'uuid';


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
        // let user_id = credentials.idToken;
        // console.log("user_id: ", user_id);
        // const user = await getUser(user_id);
        // if (user) {
        //   console.log("user: ", user);
        // }
        // else {
        //   console.log("user not found");
        //   // make new user
        //   const newUser: MongoUser = {
        //     _id: uuidv4(),
        //     name: credentials.idTokenPayload.name,
        //     pods: [],
        //     user_id: user_id,
        //   }
        //   await createUser(newUser);
        // }
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