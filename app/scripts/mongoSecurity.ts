import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { env } from '../config/env';
// import { Credentials, Auth0 } from 'react-native-auth0';
export const BASE_URL = env.BASE_URL
const RIVET_API_KEY = env.RIVET_API_KEY


export const makeAuthenticatedRequest = async (url: string, method: string = 'GET', body?: any, retries = 3): Promise<any> => {
  try {
    let accessToken = await SecureStore.getItemAsync('auth0AccessToken');
    if (!accessToken) {
      throw new Error('No access token available');
    }
    if (!RIVET_API_KEY) {
      throw new Error('No RIVET_API_KEY available');
    }
    if (!BASE_URL) {
      throw new Error('No BASE_URL available');
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-API-Key': RIVET_API_KEY,
      },
      body: JSON.stringify(body)
    };

    const response = await fetch(url, fetchOptions) as Response;
    return await response.json();
  } catch (error: any) {
    console.log('url', url);
    console.log('error', error);
  }
};
