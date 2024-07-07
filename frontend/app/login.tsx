import { View, Text, StyleSheet, Image } from 'react-native';
import GoogleLoginButton from '@/components/GoogleButton';
function Login() {
  return (
          <View style={styles.container}>
            <Text>Welcome to Podcast Pro</Text>
          <GoogleLoginButton />
          </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
  },
  button: {
    width: '100%',
    borderRadius: 25,
  },
  buttonContent: {
    paddingVertical: 10,
  },
});
export default Login;