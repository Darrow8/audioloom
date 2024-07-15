import React from 'react';
import {Alert, Button, StyleSheet, Text, View} from 'react-native';
import {useAuth0, Auth0Provider} from 'react-native-auth0';
import * as config from "../auth0_config";
const Login = () => {
  const {authorize, clearSession, user, error, getCredentials, isLoading} = useAuth0();

  const onLogin = async () => {
    try {
      await authorize();
      let credentials = await getCredentials();
      if(credentials == undefined){
        console.log('undefined credentials in onLogin')
        return;
      }
      Alert.alert('AccessToken: ' + credentials.accessToken);
    } catch (e) {
      console.log(e);
    }
  };

  const loggedIn = user !== undefined && user !== null;

  const onLogout = async () => {
    try {
      await clearSession();
    } catch (e) {
      console.log('Log out cancelled');
    }
  };
  
  if (isLoading) {
    return <View style={styles.container}><Text>Loading</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}> Auth0Sample - Login </Text>
      {user && <Text>You are logged in as {user.name}</Text>}
      {!user && <Text>You are not logged in</Text>}
      {error && <Text>{error.message}</Text>}
      <Button
        onPress={loggedIn ? onLogout : onLogin}
        title={loggedIn ? 'Log Out' : 'Log In'}
      />
      {/* <Button onPress={signIn} title='Sign Up'></Button> */}
    </View>
  );
};

const Auth = () => {
  return (
    <Auth0Provider domain={config.default.domain} clientId={config.default.clientId}>
      <Login />
    </Auth0Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});

export default Auth;