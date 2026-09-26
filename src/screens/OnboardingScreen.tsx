import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import OnboardingFlow, { defaultSteps } from '@components/common/OnboardingFlow';
import { completeOnboarding } from '@store/slices/userSlice';
import { colors } from '../theme';

/**
 * First-run introduction: welcome, the required privacy consent, how the app
 * works, setting up your space, and a friendly "you are ready".
 * Completing it moves the user on to sign-in.
 */
interface OnboardingScreenProps {
  /** Called after onboarding (including privacy consent) is completed. */
  onComplete?: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const dispatch = useDispatch();

  const handleComplete = () => {
    dispatch(completeOnboarding());
    onComplete?.();
  };

  return (
    <View style={styles.container} testID="onboarding-screen">
      <OnboardingFlow visible={true} onComplete={handleComplete} steps={defaultSteps} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default OnboardingScreen;
