import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Auth0 from 'react-native-auth0';
import auth0, { useAuth0, Auth0Provider } from 'react-native-auth0';
import * as config from '@/auth0_config';
// import * as mongo from '@/scripts/auth_mongo';
// import { MongoUser, Pod } from '@/scripts/user';

const LoginButton = () => {
  const { authorize, clearSession, isLoading } = useAuth0();


  if (isLoading) {
    return <View><Text>Loading...</Text></View>;
  }

  const onLogin = async () => {
    try {
      let credentials = await authorize();
      console.log("credentials: ", credentials);

      // console.log("user.sub: ", user?.sub);
      // if (user?.sub == undefined) {
      //   throw "error, user does not have an ID"
      // }

      // let mongo_user = await mongo.getRecordById("users", user?.sub as string);
      // if (mongo_user == false) {
      //   let new_pod = { readings: [], audio: [] } as Pod;
      //   let new_mongo_user = { _id: "", name: "", user_id: "hello", pod: new_pod } as MongoUser


      //   await mongo.createRecord(new_mongo_user, "users").then(() => {
      //     console.log('succesfully created mongodb user');
      //   })
      // }
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