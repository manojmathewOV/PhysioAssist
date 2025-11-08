import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import PoseDetectionScreen from '../screens/PoseDetectionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import WebPoseDetectionScreen from '../screens/web/WebPoseDetectionScreen';

// Redux
import type { RootState } from '../store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PoseScreen = Platform.OS === 'web' ? WebPoseDetectionScreen : PoseDetectionScreen;

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'PoseDetection') {
            iconName = 'fitness-center';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <Icon name={iconName!} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="PoseDetection"
        component={PoseScreen}
        options={{ title: 'Exercises' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  // Connect to Redux auth state (HIPAA-compliant secure authentication)
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const hasCompletedOnboarding = useSelector((state: RootState) => state.user.hasCompletedOnboarding);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
