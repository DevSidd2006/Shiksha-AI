import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppThemeMode = 'dark' | 'light';

interface AppThemeContextValue {
  mode: AppThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: AppThemeMode) => void;
  hydrated: boolean;
}

const STORAGE_KEY = 'app_theme_mode_v1';

const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<AppThemeMode>('dark');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && (saved === 'dark' || saved === 'light')) {
          setMode(saved);
        }
      } catch (error) {
        console.log('Failed to load app theme preference.', error);
      } finally {
        if (mounted) {
          setHydrated(true);
        }
      }
    };

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = useCallback((nextMode: AppThemeMode) => {
    setMode(nextMode);
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch((error) => {
      console.log('Failed to persist app theme preference.', error);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const nextMode: AppThemeMode = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, nextMode).catch((error) => {
        console.log('Failed to persist app theme preference.', error);
      });
      return nextMode;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      toggleTheme,
      setThemeMode,
      hydrated,
    }),
    [mode, toggleTheme, setThemeMode, hydrated]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context;
};
