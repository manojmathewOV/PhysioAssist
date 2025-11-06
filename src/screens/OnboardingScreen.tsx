import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OnboardingScreen: React.FC = () => {
  return (
    <View style={styles.container} testID="onboarding-screen">
      <Text style={styles.title}>Welcome to PhysioAssist</Text>
      <Text>Onboarding content</Text>
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

export default OnboardingScreen;
