import React from 'react';
import { Text, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useStateContext } from '@/state/StateContext';
import { useAuth0 } from 'react-native-auth0';

const Profile = () => {
  const { clearSession, hasValidCredentials } = useAuth0();
  const { state, dispatch } = useStateContext();
  const onLogout = async () => {
    try {
      await clearSession();
      if (!hasValidCredentials()) {
        await SecureStore.deleteItemAsync('auth0AccessToken');
        dispatch({ type: 'LOGOUT' });        
      }
    } catch (e) {
      console.log('Log out cancelled');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: state.user?.picture }}
          style={styles.profileImage}
        />
        {
          state.user?.email == state.user?.name ? 
          <>
            {state.user?.nickname && <Text style={styles.name}>{state.user.nickname}</Text>}
            {state.user?.email && <Text style={styles.username}>{state.user.email}</Text>}
          </>
          : <>
            {state.user?.name && <Text style={styles.name}>{state.user.name}</Text>}
            {state.user?.email ?  
            <Text style={styles.username}>{state.user.email}</Text>
            : <Text style={styles.username}>{state.user?.nickname}</Text>
            }
          </>
        }
        
      </View>

      <View style={styles.content}>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={onLogout}>
            <Text style={styles.actionButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;