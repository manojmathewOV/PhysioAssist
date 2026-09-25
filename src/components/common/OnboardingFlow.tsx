/**
 * OnboardingFlow
 *
 * A calm, step-by-step first-run guide. Each step has a large illustration,
 * a short title and one or two plain sentences. One big button moves forward;
 * Back and Skip stay quiet. A step can require a consent tick (the privacy
 * policy), which neither Next nor Skip can bypass.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { AppText, Banner, BigButton, Card } from '../ui';
import { colors, radii, spacing, touch } from '../../theme';

export type OnboardingTone = 'primary' | 'success' | 'accent';

export interface OnboardingPoint {
  icon: string;
  text: string;
}

export interface OnboardingStep {
  title: string;
  description: string;
  /** MaterialIcons name for the large illustration. */
  icon?: string;
  tone?: OnboardingTone;
  /** A few short supporting points, each with an icon. */
  points?: OnboardingPoint[];
  /**
   * When set, the user must tick this consent checkbox before continuing past
   * the step, and "Skip" cannot bypass it.
   */
  consent?: {
    label: string;
    requiredMessage: string;
  };
}

interface OnboardingFlowProps {
  visible: boolean;
  onComplete: () => void;
  steps?: OnboardingStep[];
}

const TONES: Record<OnboardingTone, { bg: string; fg: string; ring: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primary, ring: '#F0F8FB' },
  success: { bg: colors.successSoft, fg: colors.success, ring: '#F2FAF5' },
  accent: { bg: colors.accentSoft, fg: colors.warning, ring: '#FEF8F2' },
};

const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const inWords = (n: number) => NUMBER_WORDS[n - 1] ?? String(n);

export const PRIVACY_CONSENT_STEP: OnboardingStep = {
  title: 'Your privacy',
  description: 'Before we start, here is how we look after your information.',
  icon: 'verified-user',
  tone: 'success',
  points: [
    {
      icon: 'videocam',
      text: 'The camera is only used while you exercise.',
    },
    {
      icon: 'smartphone',
      text: 'Video stays on this phone. It is never recorded or sent.',
    },
    {
      icon: 'lock',
      text: 'Your details are stored safely on this phone.',
    },
  ],
  consent: {
    label: 'I have read and accept the Privacy Policy',
    requiredMessage: 'Please accept the Privacy Policy to continue.',
  },
};

export const defaultSteps: OnboardingStep[] = [
  {
    title: 'Welcome to PhysioAssist',
    description:
      'Your exercise helper at home. It shows you what to do and cheers you on.',
    icon: 'self-improvement',
    tone: 'primary',
  },
  PRIVACY_CONSENT_STEP,
  {
    title: 'How it works',
    description:
      'Stand in front of your phone. The camera watches how you move and guides you.',
    icon: 'videocam',
    tone: 'primary',
    points: [
      { icon: 'record-voice-over', text: 'A calm voice gives you tips as you go' },
      { icon: 'repeat', text: 'It counts your repetitions for you' },
      { icon: 'insights', text: 'You can see your progress over time' },
    ],
  },
  {
    title: 'Setting up your space',
    description: 'Find a clear spot with good light. This takes about a minute.',
    icon: 'stay-current-portrait',
    tone: 'accent',
    points: [
      { icon: 'stay-current-portrait', text: 'Stand the phone up at about waist height' },
      { icon: 'straighten', text: 'Step back about 2 metres so all of you is seen' },
      { icon: 'wb-sunny', text: 'Face a window or lamp' },
    ],
  },
  {
    title: 'You are ready',
    description:
      'Take it slowly and stop if anything hurts. You can see these tips again from the Home screen.',
    icon: 'check-circle',
    tone: 'success',
  },
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  visible,
  onComplete,
  steps = defaultSteps,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [acceptedConsents, setAcceptedConsents] = useState<Record<number, boolean>>({});
  const [showConsentError, setShowConsentError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Bring the message and the checkbox into view together
  useEffect(() => {
    if (showConsentError) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [showConsentError]);

  // Each new step starts at the top
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentStep]);

  const isConsentPending = (index: number) =>
    !!steps[index]?.consent && !acceptedConsents[index];

  const goTo = (index: number) => {
    setShowConsentError(false);
    setCurrentStep(index);
  };

  const toggleConsent = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    setShowConsentError(false);
    setAcceptedConsents((prev) => ({ ...prev, [currentStep]: !prev[currentStep] }));
  };

  const handleNext = () => {
    ReactNativeHapticFeedback.trigger('impactLight');

    if (isConsentPending(currentStep)) {
      setShowConsentError(true);
      return;
    }

    if (currentStep < steps.length - 1) {
      goTo(currentStep + 1);
    } else {
      ReactNativeHapticFeedback.trigger('notificationSuccess');
      onComplete();
    }
  };

  const handleBack = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    if (currentStep > 0) {
      goTo(currentStep - 1);
    }
  };

  const handleSkip = () => {
    ReactNativeHapticFeedback.trigger('impactLight');

    // Skipping the tour must never bypass a required consent step
    const pendingConsentIndex = steps.findIndex((_, index) => isConsentPending(index));
    if (pendingConsentIndex !== -1) {
      goTo(pendingConsentIndex);
      return;
    }
    onComplete();
  };

  if (!visible) {
    return null;
  }

  const step = steps[currentStep];
  const tone = TONES[step.tone ?? 'primary'];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const consentAccepted = !!acceptedConsents[currentStep];
  const canSkip = !isLastStep && !step.consent;
  // Steps with extra content get a smaller picture so everything fits on screen
  const compact = !!step.consent || (step.points?.length ?? 0) > 0;
  const stepText = `Step ${inWords(currentStep + 1)} of ${inWords(steps.length)}`;

  const nextLabel = isFirstStep ? 'Get started' : isLastStep ? "Let's begin" : 'Next';

  return (
    <SafeAreaView style={styles.screen} testID="onboarding-welcome">
      {/* Quiet navigation: Back on the left, Skip on the right */}
      <View style={styles.topBar}>
        {!isFirstStep ? (
          <Pressable
            onPress={handleBack}
            testID="onboarding-back"
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="Go to the previous step"
            style={({ pressed }) => [styles.quietButton, pressed && styles.quietPressed]}
          >
            <Icon name="arrow-back" size={24} color={colors.textSecondary} />
            <AppText variant="label" color={colors.textSecondary}>
              Back
            </AppText>
          </Pressable>
        ) : (
          <View style={styles.quietPlaceholder} />
        )}
        {canSkip ? (
          <Pressable
            onPress={handleSkip}
            testID="onboarding-skip"
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
            style={({ pressed }) => [styles.quietButton, pressed && styles.quietPressed]}
          >
            <AppText variant="label" color={colors.textSecondary}>
              Skip
            </AppText>
          </Pressable>
        ) : (
          <View style={styles.quietPlaceholder} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        testID="onboarding-scroll"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.illustrationRing,
            compact && styles.illustrationRingCompact,
            { backgroundColor: tone.ring },
          ]}
        >
          <View
            style={[
              styles.illustration,
              compact && styles.illustrationCompact,
              { backgroundColor: tone.bg },
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Icon
              name={step.icon ?? 'self-improvement'}
              size={compact ? 60 : 88}
              color={tone.fg}
            />
          </View>
        </View>

        <AppText variant="display" center accessibilityRole="header">
          {step.title}
        </AppText>
        <AppText
          variant="body"
          color={colors.textSecondary}
          center
          style={styles.description}
        >
          {step.description}
        </AppText>

        {step.points && step.points.length > 0 ? (
          <Card style={styles.points}>
            {step.points.map((point) => (
              <View key={point.text} style={styles.point}>
                <View style={[styles.pointIcon, { backgroundColor: tone.bg }]}>
                  <Icon name={point.icon} size={24} color={tone.fg} />
                </View>
                <AppText variant="body" style={styles.flex}>
                  {point.text}
                </AppText>
              </View>
            ))}
          </Card>
        ) : null}

        {step.consent && showConsentError ? (
          <Banner
            tone="warning"
            message={step.consent.requiredMessage}
            testID="onboarding-consent-error"
          />
        ) : null}

        {step.consent ? (
          <Pressable
            onPress={toggleConsent}
            testID="onboarding-privacy-checkbox"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consentAccepted }}
            accessibilityLabel={step.consent.label}
            style={({ pressed }) => [
              styles.consentRow,
              consentAccepted && styles.consentRowChecked,
              showConsentError && styles.consentRowAttention,
              pressed && styles.quietPressed,
            ]}
          >
            <View style={[styles.checkbox, consentAccepted && styles.checkboxChecked]}>
              {consentAccepted ? (
                <Icon name="check" size={26} color={colors.onPrimary} />
              ) : null}
            </View>
            <AppText variant="bodyStrong" style={styles.flex}>
              {step.consent.label}
            </AppText>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <View
          style={styles.progress}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={stepText}
        >
          <View style={styles.dots}>
            {steps.map((s, index) => (
              <View
                key={s.title}
                style={[
                  styles.dot,
                  index < currentStep && styles.dotDone,
                  index === currentStep && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <AppText variant="caption" color={colors.textMuted}>
            {stepText}
          </AppText>
        </View>
        <BigButton
          label={nextLabel}
          icon={isLastStep ? 'check' : undefined}
          onPress={handleNext}
          testID={isFirstStep ? 'onboarding-get-started' : 'onboarding-next'}
          accessibilityHint={
            isLastStep ? 'Finish the introduction and sign in' : 'Go to the next step'
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  quietButton: {
    minHeight: touch.min,
    minWidth: touch.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  quietPlaceholder: { minHeight: touch.min, minWidth: touch.min },
  quietPressed: { backgroundColor: colors.surfaceMuted },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  illustrationRing: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  illustrationRingCompact: { width: 136, height: 136, marginBottom: 0 },
  illustrationCompact: { width: 104, height: 104 },
  illustration: {
    width: 156,
    height: 156,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: { paddingHorizontal: spacing.sm, marginBottom: spacing.sm },
  points: { gap: spacing.md, paddingVertical: spacing.md + spacing.xs },
  point: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pointIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 80,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  consentRowAttention: {
    borderColor: colors.warning,
  },
  consentRowChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.textMuted,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  progress: { alignItems: 'center', gap: spacing.sm },
  dots: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  dotDone: { backgroundColor: colors.primary, opacity: 0.45 },
  dotActive: { width: 28, backgroundColor: colors.primary },
});

export default OnboardingFlow;
