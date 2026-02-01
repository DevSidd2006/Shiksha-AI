import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { initializeDatabase } from '@/database/init';

export default function RootLayout() {
  useEffect(() => {
    // Initialize database on app start
    initializeDatabase();

    // Hide device navigation bar (bottom menu buttons) on Android
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('sticky-immersive');
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
