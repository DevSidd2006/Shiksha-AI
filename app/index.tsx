import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { isAuthenticated } from '@/storage/authStore';
import { AuthScreen } from '@/components/AuthScreen';
import { getActiveModelPath, hasDownloadedModel } from '@/services/modelDownloadService';
import { setOfflineModelPath } from '@/services/offlineTutor';
import { llamaBridge } from '@/services/nativeLlama';
import { initializeDatabase } from '@/database/init';

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
    return <Redirect href="/model-manager" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
