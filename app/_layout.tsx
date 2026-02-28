import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { llamaBridge } from '@/features/ai';
import { SyncManager } from '@/core';
import NetInfo from '@react-native-community/netinfo';

export default function RootLayout() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Hide device navigation bar (bottom menu buttons) on Android
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }

    // Trigger initial sync attempt on boot
    SyncManager.runSync();

    // Listen to network changes: if we suddenly come online, try to sync
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        SyncManager.runSync();
      }
    });

    const subscription = AppState.addEventListener('change', nextAppState => {
      // 1. Memory Management: If going to the background, unload AI model
      if (
        appState.current.match(/inactive|active/) &&
        nextAppState === 'background'
      ) {
        console.log('App going background. Unloading AI model from memory.');
        llamaBridge.stop();
      }

      // 2. Sync Management: If coming to the foreground, trigger sync
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App returning to foreground. Triggering sync loop.');
        SyncManager.runSync();
      }

      appState.current = nextAppState;
    });

    return () => {
      unsubscribeNetInfo();
      subscription.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="setup-choice" />
      <Stack.Screen name="model-manager" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
