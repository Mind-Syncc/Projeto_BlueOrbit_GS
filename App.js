import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import { auth } from './src/firebase/config';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/main/DashboardScreen';
import SpaceObjectsScreen from './src/screens/space/SpaceObjectsScreen';
import SpaceObjectDetailScreen from './src/screens/space/SpaceObjectDetailScreen';
import OrbitalMapScreen from './src/screens/space/OrbitalMapScreen';
import OccurrencesScreen from './src/screens/space/OccurrencesScreen';
import AIAnalysisScreen from './src/screens/ai/AIAnalysisScreen';
import AIChatScreen from './src/screens/ai/AIChatScreen';
import NotificationsScreen from './src/screens/main/NotificationsScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    signOut(auth).finally(() => {
      const unsubscribe = onAuthStateChanged(auth, currentUser => {
        setUser(currentUser);
        setLoading(false);
      });
      return unsubscribe;
    });
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="OrbitalMap" component={OrbitalMapScreen} />
            {/* Alerts tab now shows space objects list */}
            <Stack.Screen name="Alerts" component={SpaceObjectsScreen} />
            <Stack.Screen name="SpaceObjectDetail" component={SpaceObjectDetailScreen} />
            <Stack.Screen name="AIAnalysis" component={AIAnalysisScreen} />
            <Stack.Screen name="AIChat" component={AIChatScreen} />
            <Stack.Screen name="Occurrences" component={OccurrencesScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}