import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import OnboardingFlow, {
  defaultSteps,
  OnboardingStep,
  PRIVACY_CONSENT_STEP,
} from '@components/common/OnboardingFlow';
import { completeOnboarding } from '@store/slices/userSlice';

/**
 * First-run onboarding: welcome, the required privacy consent, then the setup tips.
 * Completing it moves the user on to sign-in.
 */
const ONBOARDING_STEPS: OnboardingStep[] = [
  defaultSteps[0],
  PRIVACY_CONSENT_STEP,
  ...defaultSteps.slice(1),
];

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
      <OnboardingFlow
        visible={true}
        onComplete={handleComplete}
        steps={ONBOARDING_STEPS}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OnboardingScreen;
