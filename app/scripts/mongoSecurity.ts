import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { isValidMongoUser } from './validateData';


export const BASE_URL = 'https://api.rivetaudio.com/'
const RIVET_API_KEY = '1023hfiudobf023rhnqwof18ihr0oqefbu2rt0243heirhbnqpofb2u09tgh';

export const makeAuthenticatedRequest = async (url: string, method: string = 'GET', body?: any, retries = 3): Promise<any> => {
  const accessToken = await SecureStore.getItemAsync('auth0AccessToken');

  if (!accessToken) {
    throw new Error('No access token available');
  }

  const fetchWithTimeout = (url: string, options: RequestInit, timeout = 10000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
    ]);
  };

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-API-Key': RIVET_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  // For iOS in development, ignore SSL certificate errors
  if (__DEV__ && Platform.OS === 'ios') {
    // @ts-ignore
    fetchOptions.credentials = 'omit';
  }

  try {
    console.log(`Attempting ${method} request to: ${url}`);
    const response = await fetchWithTimeout(url, fetchOptions) as Response;
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error response body:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log('error', error);
    console.error('Fetch error details:', error);
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      return makeAuthenticatedRequest(method, body, retries - 1);
    }
    Alert.alert('Error', 'There was a problem connecting to the server. Please check your internet connection and try again.');
    throw error;
  }
};