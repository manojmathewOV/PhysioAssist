import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '@store/slices/userSlice';
import { RootState } from '@store/index';
import { AppText, Banner, BigButton, Card, Screen } from '../components/ui';
import { colors, radii, spacing, touch, typography } from '../theme';

export interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginScreenProps {
  /**
   * Optional authentication handler. When provided, validated credentials are
   * handed to it instead of the built-in mock authentication.
   */
  onLogin?: (credentials: LoginCredentials) => void | Promise<void>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A large text field with a visible label above it. */
const Field: React.FC<
  TextInputProps & { label: string; trailing?: React.ReactNode; invalid?: boolean }
> = ({ label, trailing, invalid, ...inputProps }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <AppText variant="label" color={colors.text}>
        {label}
      </AppText>
      <View
        style={[
          styles.inputBox,
          focused && styles.inputBoxFocused,
          invalid && !focused && styles.inputBoxInvalid,
        ]}
      >
        <TextInput
          {...inputProps}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          maxFontSizeMultiplier={1.6}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
        {trailing}
      </View>
    </View>
  );
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Inline validation errors take precedence over the last auth error
  const displayedError = validationError ?? error;

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      setValidationError('Please enter your email and password.');
      return;
    }

    // Email validation
    if (!EMAIL_REGEX.test(email)) {
      setValidationError('Please enter a valid email address, like name@example.com.');
      return;
    }

    setValidationError(null);

    if (onLogin) {
      await onLogin({ email, password });
      return;
    }

    dispatch(loginStart());

    try {
      // Mock authentication - In production, replace with actual API call
      // For now, accept any valid email format and password length >= 6
      if (password.length >= 6) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock user data
        const mockUser = {
          id: 'user-' + Date.now(),
          email: email,
          name: email.split('@')[0],
          profile: {
            fitnessLevel: 'beginner' as const,
            goals: [],
            injuries: [],
          },
        };

        dispatch(loginSuccess(mockUser));
      } else {
        dispatch(loginFailure('Your password needs at least 6 characters.'));
      }
    } catch (err) {
      dispatch(loginFailure('Something went wrong. Please try again.'));
    }
  };

  const handleDemoLogin = () => {
    setValidationError(null);
    setEmail('demo@physioassist.com');
    setPassword('demo123');
    setTimeout(() => {
      dispatch(loginStart());
      const mockUser = {
        id: 'demo-user',
        email: 'demo@physioassist.com',
        name: 'Demo User',
        profile: {
          fitnessLevel: 'intermediate' as const,
          goals: ['Improve flexibility', 'Strengthen core'],
          injuries: [],
        },
      };
      dispatch(loginSuccess(mockUser));
    }, 100);
  };

  const updateEmail = (value: string) => {
    setEmail(value);
    if (validationError) setValidationError(null);
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    if (validationError) setValidationError(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen testID="login-screen">
        <View style={styles.hero}>
          <View
            style={styles.heroIcon}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Icon name="self-improvement" size={56} color={colors.primary} />
          </View>
          <AppText variant="display" center accessibilityRole="header">
            Welcome
          </AppText>
          <AppText variant="body" color={colors.textSecondary} center>
            Sign in to see your exercises.
          </AppText>
        </View>

        <Card style={styles.form}>
          <Field
            label="Email address"
            placeholder="name@example.com"
            value={email}
            onChangeText={updateEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            editable={!isLoading}
            invalid={!!displayedError}
            testID="auth-email-input"
            accessibilityLabel="Email address"
            accessibilityHint="Enter your email address"
          />

          <Field
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={updatePassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            editable={!isLoading}
            invalid={!!displayedError}
            testID="auth-password-input"
            accessibilityLabel="Password"
            accessibilityHint="Enter your password"
            trailing={
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                testID="password-toggle"
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                style={({ pressed }) => [
                  styles.toggle,
                  pressed && { backgroundColor: colors.primarySoft },
                ]}
              >
                <Icon
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={24}
                  color={colors.primary}
                />
                <AppText variant="label" color={colors.primary}>
                  {showPassword ? 'Hide' : 'Show'}
                </AppText>
              </Pressable>
            }
          />

          {displayedError ? (
            <Banner tone="danger" message={displayedError} testID="auth-error-message" />
          ) : null}

          <BigButton
            label="Sign in"
            icon="login"
            onPress={handleLogin}
            loading={isLoading}
            testID="auth-login-button"
          />
        </Card>

        <View style={styles.divider} accessibilityElementsHidden>
          <View style={styles.dividerLine} />
          <AppText variant="caption" color={colors.textMuted}>
            or
          </AppText>
          <View style={styles.dividerLine} />
        </View>

        <BigButton
          label="Continue as demo user"
          icon="person-outline"
          variant="secondary"
          onPress={handleDemoLogin}
          disabled={isLoading}
          testID="demo-login-button"
          accessibilityHint="Try the app without an account"
        />

        <AppText variant="caption" color={colors.textMuted} center style={styles.note}>
          This is a demo. Sign-in is simulated on this phone.
        </AppText>
      </Screen>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: 104,
    height: 104,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  inputBox: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  inputBoxFocused: {
    borderColor: colors.primary,
  },
  inputBoxInvalid: {
    borderColor: colors.danger,
  },
  input: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  toggle: {
    minHeight: touch.min,
    minWidth: touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + spacing.xs,
    borderRadius: radii.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  note: {
    marginTop: spacing.sm,
  },
});

export default LoginScreen;
