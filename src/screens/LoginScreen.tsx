import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LoginScreen: React.FC = () => {
  return (
    <View style={styles.container} testID="login-screen">
      <Text style={styles.title}>Login</Text>
      <Text>Login form content</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default LoginScreen;