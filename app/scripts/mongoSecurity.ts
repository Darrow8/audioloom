import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { env } from '../config/env';

export const BASE_URL = env.BASE_URL 
const RIVET_API_KEY = env.RIVET_API_KEY 

export const makeAuthenticatedRequest = async (url: string, method: string = 'GET', body?: any, retries = 3): Promise<any> => {
  const accessToken = await SecureStore.getItemAsync('auth0AccessToken');
  console.log(accessToken);
  if (!accessToken) {
    throw new Error('No access token available');
  }

  if(!RIVET_API_KEY) {
    throw new Error('No RIVET_API_KEY available');
  }
  if(!BASE_URL) {
    throw new Error('No BASE_URL available');
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
    body: JSON.stringify(body)
  };
  console.log('fetchOptions', fetchOptions);

  try {
    const response = await fetchWithTimeout(url, fetchOptions) as Response;

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error response body:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log('url', url);
    console.log('error', error);
  }
};