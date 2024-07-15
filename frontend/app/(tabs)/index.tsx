import { Image, StyleSheet, Platform } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {Text, View} from 'react-native';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const [data, setData] = useState(null);

  // const getData = async () => {
  //   try {
  //     const response = await fetch('http://localhost:5000/api/auth'); // replace <your-ip-address> with your backend's IP address
  //     const result = await response.json();
  //     setData(result);
  //     console.log(result);
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //   }
  // };

  // useEffect(() => {
  //   getData();
  // }, []);
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      {/* <Text>{userInfo.user?.name}</Text>
      <Text>{userInfo.user?.email}</Text>
      <Logout />
      <Text>{JSON.stringify(data)}</Text> */}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
