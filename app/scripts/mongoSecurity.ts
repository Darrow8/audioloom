import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';


// export const BASE_URL = 'https://api.rivetaudio.com/'
export const BASE_URL = 'http://localhost:3000/'
const RIVET_API_KEY = '1023hfiudobf023rhnqwof18ihr0oqefbu2rt0243heirhbnqpofb2u09tgh';

export const makeAuthenticatedRequest = async (url: string, method: string = 'GET', body?: any, retries = 3): Promise<any> => {
  const accessToken = await SecureStore.getItemAsync('auth0AccessToken');
  console.log('calling...')
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
    const response = await fetchWithTimeout(url, fetchOptions) as Response;

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error response body:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log('error', error);
  }
};