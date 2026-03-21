import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getProfile } from '@/features/user';
import { useAppTheme } from '@/shared';

interface ThemePalette {
  surface: string;
  panel: string;
  panelSoft: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  headerGradient: [string, string];
  cardGradient: [string, string];
  chipBg: string;
}

const darkTheme: ThemePalette = {
  surface: '#06070B',
  panel: '#11131A',
  panelSoft: '#191D27',
  border: 'rgba(255,255,255,0.09)',
  text: '#F7F9FF',
  textMuted: '#9AA5BD',
  accent: '#2DDCFF',
  headerGradient: ['#0C1020', '#11131A'],
  cardGradient: ['#151A27', '#10131A'],
  chipBg: '#1E2A52',
};

const lightTheme: ThemePalette = {
  surface: '#F4F6FB',
  panel: '#FFFFFF',
  panelSoft: '#ECF1FA',
  border: 'rgba(10,14,28,0.12)',
  text: '#0E1322',
  textMuted: '#65708A',
  accent: '#155EEF',
  headerGradient: ['#EEF3FF', '#FFFFFF'],
  cardGradient: ['#FFFFFF', '#F3F7FF'],
  chipBg: '#E4ECFF',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        if (data) setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => router.replace('/'),
      },
    ]);
  };

  const STATS = [
    { label: 'Chapters', value: '12', icon: 'book' as const, color: '#6366F1' },
    { label: 'Quizzes', value: '45', icon: 'check-circle' as const, color: '#10B981' },
    { label: 'Streak', value: '7', icon: 'fire' as const, color: '#F59E0B' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <LinearGradient colors={theme.headerGradient as any} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandWrap}>
              <View style={styles.brandIcon}>
                <Ionicons name="person" size={15} color={theme.accent} />
              </View>
              <Text style={styles.brandText}>Account</Text>
            </View>

            <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={theme.text} />
            </TouchableOpacity>
          </View>

          <LinearGradient colors={theme.cardGradient as any} style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}</Text>
              </View>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.userName}>{profile?.name || 'Student'}</Text>
              <Text style={styles.userGrade}>{profile?.grade || 'Class 8'}</Text>
            </View>
          </LinearGradient>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.statsCard}>
            {STATS.map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <View style={[styles.statIconBg, { backgroundColor: `${stat.color}22` }]}>
                  <FontAwesome5 name={stat.icon} size={14} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Preferences</Text>
          <View style={styles.groupCard}>
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: isDark ? '#17223F' : '#E7EEFF' }]}>
                  <Ionicons name="notifications-outline" size={16} color={theme.accent} />
                </View>
                <Text style={styles.rowText}>Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#3A4255', true: '#7DA9FF' }}
                thumbColor={notifications ? '#FFFFFF' : '#D1D5DB'}
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: isDark ? '#173321' : '#DCFCE7' }]}>
                  <MaterialIcons name="alarm" size={16} color="#16A34A" />
                </View>
                <Text style={styles.rowText}>Study Reminders</Text>
              </View>
              <Switch
                value={studyReminders}
                onValueChange={setStudyReminders}
                trackColor={{ false: '#3A4255', true: '#7DA9FF' }}
                thumbColor={studyReminders ? '#FFFFFF' : '#D1D5DB'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & App</Text>
          <View style={styles.groupCard}>
            <MenuRow icon="settings-outline" label="App Settings" onPress={() => router.push('/settings')} theme={theme} />
            <View style={styles.separator} />
            <MenuRow icon="time-outline" label="Chat History" onPress={() => router.push('/history')} theme={theme} />
            <View style={styles.separator} />
            <MenuRow icon="document-text-outline" label="My Study Notes" onPress={() => router.push('/notes')} theme={theme} />
            <View style={styles.separator} />
            <MenuRow icon="person-outline" label="Edit Profile" onPress={() => Alert.alert('Coming soon')} theme={theme} />
            <View style={styles.separator} />
            <MenuRow icon="shield-checkmark-outline" label="Privacy & Security" onPress={() => Alert.alert('Coming soon')} theme={theme} />
            <View style={styles.separator} />
            <MenuRow icon="log-out-outline" label="Log Out" onPress={handleLogout} destructive theme={theme} />
          </View>
        </View>

        <View style={styles.versionWrap}>
          <Text style={styles.versionText}>Shiksha AI v1.0.0</Text>
          <Text style={styles.versionText}>Built for focused learning</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  theme,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  theme: ThemePalette;
  destructive?: boolean;
}) {
  const textColor = destructive ? '#EF4444' : theme.text;
  const iconColor = destructive ? '#EF4444' : theme.textMuted;

  return (
    <TouchableOpacity style={menuStyles.row} onPress={onPress}>
      <View style={menuStyles.left}>
        <View style={[menuStyles.iconWrap, { backgroundColor: theme.panelSoft }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={[menuStyles.label, { color: textColor }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    contentContainer: {
      paddingBottom: 28,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
      marginBottom: 12,
    },
    brandWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    brandIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.chipBg,
    },
    brandText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
    },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
    },
    profileCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarWrap: {
      borderRadius: 999,
      padding: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.chipBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '800',
    },
    profileMeta: {
      flex: 1,
    },
    userName: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '800',
    },
    userGrade: {
      color: theme.textMuted,
      fontSize: 13,
      marginTop: 4,
      fontWeight: '600',
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 14,
      gap: 10,
    },
    statsCard: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    statIconBg: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statValue: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '800',
    },
    statLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
    },
    groupCard: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    toggleRow: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
    },
    separator: {
      height: 1,
      backgroundColor: theme.border,
    },
    versionWrap: {
      paddingHorizontal: 16,
      paddingTop: 20,
      alignItems: 'center',
      gap: 2,
    },
    versionText: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },
  });
