import React from 'react';
import { View, Button, Linking, Alert, StyleSheet } from 'react-native';
import qs from 'qs';

interface EmailParams {
  to: string;
  subject: string;
  body: string;
}

export const sendEmail = async ({ to, subject, body }: EmailParams): Promise<void> => {
    let url = `mailto:${to}`;
  
    // Create email link query
    const query = qs.stringify({
      subject: subject,
      body: body,
    });
  
    if (query.length) {
      url += `?${query}`;
    }
  
    // Check if we can use this link
    const canOpen = await Linking.canOpenURL(url);
  
    if (!canOpen) {
      throw new Error('Provided URL can not be handled');
    }
  
    return Linking.openURL(url);
  };