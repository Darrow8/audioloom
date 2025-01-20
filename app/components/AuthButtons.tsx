import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import auth0, { useAuth0, Auth0Provider } from 'react-native-auth0';
import * as SecureStore from 'expo-secure-store';
import { debounce } from 'lodash';
import { env } from '../config/env';
import { Colors } from '../constants/Colors';

const AuthButtons = () => {
  const { authorize, isLoading, user } = useAuth0();
  const [disableAuthButtons, setDisableAuthButtons] = useState(false);

  useEffect(() => {
    if(user != null){
      setDisableAuthButtons(true);
    }else{
      setDisableAuthButtons(false);
    }
  }, [user]);

  if (isLoading) {
    return <View><Text>Loading...</Text></View>;
  }

  const debouncedLogin = debounce(async () => {
    try {
      await authorize({
        scope: 'openid profile email offline_access',
        audience: env.AUTH0_AUDIENCE,
        additionalParameters: {
          prompt: 'select_account',
          screen_hint: 'login'
        }
      });
    } catch (e) {
      console.log(e);
    }
  }, 500);

  const debouncedSignup = debounce(async () => {
    try {
      await authorize({
        scope: 'openid profile email offline_access', 
        audience: env.AUTH0_AUDIENCE,
        additionalParameters: {
          prompt: 'select_account',
          screen_hint: 'signup'
        }
      });
      // await SecureStore.setItemAsync('signingUp', 'true');
    } catch (e) {
      console.log(e);
    }
  }, 500);

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity 
        style={[styles.button, disableAuthButtons && styles.buttonDisabled]} 
        onPress={debouncedLogin}
        disabled={disableAuthButtons}
      >
        <Text style={[styles.buttonText, disableAuthButtons && styles.buttonTextDisabled]}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.button, disableAuthButtons && styles.buttonDisabled]} 
        onPress={debouncedSignup}
        disabled={disableAuthButtons}
      >
        <Text style={[styles.buttonText, disableAuthButtons && styles.buttonTextDisabled]}>Sign Up</Text>
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
    backgroundColor: Colors.theme.lightBlue,
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
  },
  buttonDisabled: {
    backgroundColor: Colors.theme.lightBlue + '80',
    opacity: 0.5,
  },
  buttonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  }
});

export default AuthButtons;