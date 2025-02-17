import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Colors } from '@/constants/Colors';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SettingsPage from '@/components/settings';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  const [showSettings, setShowSettings] = useState(false);
  const router = useRouter();
  let size = 28;

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.tint,
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerTintColor: Colors.light.header,
          headerTitleStyle: {
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Listen',
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome6 name="headphones-simple" size={size} color={color} />
            ),
            // headerRight: () => (
            //   <TouchableOpacity
            //     onPress={() => setShowSettings(true)}
            //     style={{ marginRight: 30 }}
            //   >
            //     <MaterialIcons name="workspace-premium" size={24} color={Colors.theme.lightBlue} />
            //   </TouchableOpacity>
            // )
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => setShowSettings(true)}
                style={{ marginRight: 30 }}
              >
                <AntDesign name="setting" size={24} color={Colors.light.header} />
              </TouchableOpacity>
            ),
            tabBarIcon: ({ color, focused }) => (
              <AntDesign name="user" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {showSettings && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <AntDesign name="close" size={24} color={Colors.light.header} />
            </TouchableOpacity>
            <SettingsPage />
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    height: '80%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
});
