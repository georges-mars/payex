import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import magically from 'magically-sdk';
import { Skeleton } from '../components/ui';
import LoginScreen from '../screens/LoginScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { SendMoneyScreen } from '../screens/SendMoneyScreen';
import { LinkAccountScreen } from '../screens/LinkAccountScreen';
import MainTabNavigator from './MainTabNavigator';
import { useAppStateStore } from '../stores/appStateStore';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  MainTabs: undefined;
  Feedback: undefined;
  Profile: undefined;
  SendMoney: undefined;
  LinkAccount: undefined;
  // Detail screens (no tabs shown)
  Settings: undefined;
  ItemDetail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  // REACTIVE PATTERN: Navigator reacts to state changes
  // Screens update stores -> Stores update state -> Navigator re-renders
  const isAuthenticated = useAppStateStore((state) => state.isAuthenticated);
  const updateState = useAppStateStore((state) => state.updateState);

  useEffect(() => {
    // Initialize auth state from SDK
    updateState({ isAuthenticated: magically.auth.isAuthenticated });

    // Listen for auth state changes and update store
    // This is REACTIVE: SDK emits event -> Store updates -> UI re-renders
    const unsubscribe = magically.auth.onAuthStateChanged((authState) => {
      updateState({ isAuthenticated: authState.isAuthenticated });
    });

    return unsubscribe;
  }, [updateState]);

  // IMPORTANT: Add more conditions here as needed for your app
  // Example: const needsOnboarding = useAppStateStore(state => state.needsOnboarding);
  // Then use: !isAuthenticated ? (...) : needsOnboarding ? (...) : (...)
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth flow: Welcome → Login
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      ) : (
        // Authenticated: Show main app
        <>
          {/* TABS SCREEN - Shows bottom tabs */}
          {/* Please remove if tabs are not needed */}
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          
          {/* DETAIL SCREENS - These hide the tabs automatically */}
          <Stack.Screen name="Feedback" component={FeedbackScreen}/>
          <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
          <Stack.Screen name="LinkAccount" component={LinkAccountScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;