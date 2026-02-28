import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { isAuthenticated } from '@/features/user';
import { AuthScreen } from '@/features/auth';
import { getActiveModelPath, hasDownloadedModel } from '@/features/ai';
import { setOfflineModelPath } from '@/features/ai';
import { llamaBridge } from '@/features/ai';
import { initializeDatabase } from '@/core';

export default function Index() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [hasModel, setHasModel] = useState<boolean | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      await initializeDatabase();
      const authenticated = await isAuthenticated();
      setIsAuth(authenticated);

      if (authenticated) {
        const modelReady = await hasDownloadedModel();
        setHasModel(modelReady);

        if (modelReady) {
          const modelPath = await getActiveModelPath();
          if (modelPath) {
            setOfflineModelPath(modelPath);
            await llamaBridge.ensure(modelPath);
          }
        }
      }
    } catch (error) {
      console.error('Startup status check failed:', error);
      setIsAuth(false);
    }
  };

  const handleAuthSuccess = async () => {
    setIsAuth(true);
    const modelReady = await hasDownloadedModel();
    setHasModel(modelReady);
    if (modelReady) {
      const modelPath = await getActiveModelPath();
      if (modelPath) {
        setOfflineModelPath(modelPath);
        await llamaBridge.ensure(modelPath);
      }
    }
  };

  if (isAuth === null || (isAuth && hasModel === null)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!isAuth) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  if (isAuth && !hasModel) {
    return <Redirect href="/setup-choice" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
