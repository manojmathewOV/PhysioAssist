import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import OnboardingFlow from '@components/common/OnboardingFlow';
import { completeOnboarding } from '@store/slices/userSlice';

const OnboardingScreen: React.FC = () => {
  const dispatch = useDispatch();

  const handleComplete = () => {
    dispatch(completeOnboarding());
  };

  return (
    <View style={styles.container} testID="onboarding-screen">
      <OnboardingFlow visible={true} onComplete={handleComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OnboardingScreen;
