import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { isAuthenticated } from '@/storage/authStore';
import { AuthScreen } from '@/components/AuthScreen';

export default function Index() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    setIsAuth(authenticated);
  };

  const handleAuthSuccess = () => {
    setIsAuth(true);
  };

  if (isAuth === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!isAuth) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
