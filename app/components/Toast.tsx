import { Colors } from '@/constants/Colors';
import React, { useEffect } from 'react';
import { Animated, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity, View } from 'react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ visible, message, duration = 3000, onDismiss }) => {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.contentContainer}>
        <Text style={styles.text}>{message}</Text>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

interface Styles {
  container: ViewStyle;
  contentContainer: ViewStyle;
  text: TextStyle;
  dismissButton: ViewStyle;
  dismissText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: Colors.theme.background,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    color: Colors.theme.text,
    flex: 1,
    marginRight: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dismissButton: {
    padding: 8,
  },
  dismissText: {
    color: Colors.theme.text,
    fontSize: 16,
    opacity: 0.8,
  },
});

export default Toast;