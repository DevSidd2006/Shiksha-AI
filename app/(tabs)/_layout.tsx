import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { useAppTheme } from '@/shared';
import { DARK_THEME, LIGHT_THEME } from '@/shared';

export default function TabLayout() {
  const { isDark } = useAppTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   isDark ? '#818CF8' : '#6366F1',
        tabBarInactiveTintColor: isDark ? '#4A5275' : '#9CA3AF',
        tabBarStyle: {
          backgroundColor:  isDark ? '#0D1025' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          elevation: 20,
          shadowColor: isDark ? '#818CF8' : '#6366F1',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.15 : 0.08,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIconStyle: { marginBottom: 2 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="tutor"
        options={{
          title: 'AI Tutor',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'robot' : 'robot-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="flashcards"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'book-open-variant' : 'book-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'chart-bar' : 'chart-bar-stacked'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account-circle' : 'account-circle-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="quiz"     options={{ href: null }} />
      <Tabs.Screen name="notes"    options={{ href: null }} />
      <Tabs.Screen name="history"  options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
