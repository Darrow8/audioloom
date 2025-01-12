import React from 'react';
import { Text, View, Image, TouchableOpacity, StyleSheet, Button } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useStateContext } from '@/state/StateContext';
import { useAuth0 } from 'react-native-auth0';
import { resetUser } from '@/scripts/mixpanel';
import { fullLogout } from '@/scripts/auth';
import { useToast } from '@/state/ToastContext';
import { Colors } from '@/constants/Colors';
const Profile = () => {
  const { clearSession, hasValidCredentials } = useAuth0();
  const { state, dispatch } = useStateContext();
  const { showToast } = useToast();
  if(state.user == undefined) {
    return <Text>Loading...</Text>
  }
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
            {state.user?.name && <Text style={styles.name}>{state.user.name}</Text>}
            {state.user?.email && <Text style={styles.username}>{state.user.email}</Text>}
          </>
          : <>
            {state.user?.name && <Text style={styles.name}>{state.user.name}</Text>}
            {state.user?.email ?  
            <Text style={styles.username}>{state.user.email}</Text>
            : <Text style={styles.username}>{state.user?.name}</Text>
            }
          </>
        }
        
      </View>

      {/* <View style={styles.content}>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => fullLogout(dispatch, clearSession)}>
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View> */}
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
    backgroundColor: Colors.theme.settings,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    color: Colors.theme.darkText,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;