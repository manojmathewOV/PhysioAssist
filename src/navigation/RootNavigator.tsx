import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import PoseScreen from './PoseScreen';
import HomeScreen from '../screens/HomeScreen';
import HelpScreen from '../screens/HelpScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';

import type { RootState } from '../store';
import { colors, typography } from '../theme';
import type {
  HomeStackParamList,
  MainTabParamList,
  SettingsStackParamList,
} from './types';

const Stack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/** Sub-pages get a plain header with a large, labelled "Back" button. */
const subPageOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerTintColor: colors.primary,
  headerTitleStyle: { fontSize: 20, fontWeight: '600', color: colors.text },
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerBackTitle: 'Back',
  contentStyle: { backgroundColor: colors.background },
};

const HomeTab = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen
      name="Help"
      component={HelpScreen}
      options={{ ...subPageOptions, title: 'Help' }}
    />
  </HomeStack.Navigator>
);

const SettingsTab = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} />
    <SettingsStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ ...subPageOptions, title: 'My details' }}
    />
  </SettingsStack.Navigator>
);

/** Tab icon, label and test id. Few tabs, big targets, always-visible labels. */
const TABS: Record<
  keyof MainTabParamList,
  { label: string; icon: string; testID: string }
> = {
  HomeTab: { label: 'Home', icon: 'home', testID: 'tab-home' },
  Exercise: { label: 'Exercise', icon: 'directions-run', testID: 'tab-exercises' },
  Progress: { label: 'Progress', icon: 'insights', testID: 'tab-progress' },
  SettingsTab: { label: 'Settings', icon: 'settings', testID: 'tab-settings' },
};

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS[route.name];
        return {
          headerShown: false,
          title: tab.label,
          tabBarTestID: tab.testID,
          tabBarAccessibilityLabel: `${tab.label} tab`,
          // Each item is a tab of the tab bar (screen readers, web)
          tabBarButton: (props) => (
            <Pressable
              {...props}
              role="tab"
              aria-selected={Boolean(props.accessibilityState?.selected)}
            />
          ),
          tabBarIcon: ({ color }) => <Icon name={tab.icon} size={30} color={color} />,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: { ...typography.label, fontSize: 15, marginBottom: 4 },
          tabBarActiveBackgroundColor: colors.primarySoft,
          tabBarItemStyle: { borderRadius: 14, marginHorizontal: 4, marginVertical: 6 },
          tabBarStyle: {
            height: 76 + insets.bottom,
            paddingBottom: insets.bottom,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        };
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeTab} />
      <Tab.Screen name="Exercise" component={PoseScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsTab} />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  // Connect to Redux auth state (HIPAA-compliant secure authentication)
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const hasCompletedOnboarding = useSelector(
    (state: RootState) => state.user.hasCompletedOnboarding
  );

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
