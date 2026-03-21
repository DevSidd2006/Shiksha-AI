import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { deleteAllChats } from '@/features/chat';
import { getOfflineMode, setOfflineMode, getPreferredLanguage, setPreferredLanguage } from '@/features/user';
import { getProfile, updateGrade, CLASS_OPTIONS } from '@/features/user';
import { useAppTheme } from '@/shared';

const LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Marathi',
  'Telugu',
  'Tamil',
  'Gujarati',
  'Kannada',
  'Odia',
  'Malayalam',
  'Punjabi',
];

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

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [offlineMode, setOfflineModeState] = useState(false);
  const [preferredLang, setPreferredLang] = useState('English');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const stored = await getOfflineMode();
      setOfflineModeState(stored);

      const lang = await getPreferredLanguage();
      setPreferredLang(lang);

      try {
        const userProfile = await getProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    })();
  }, []);

  const handleOfflineToggle = async (value: boolean) => {
    setOfflineModeState(value);
    await setOfflineMode(value);
  };

  const handleLanguageChange = async () => {
    const currentIndex = LANGUAGES.indexOf(preferredLang);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    const nextLang = LANGUAGES[nextIndex];

    setPreferredLang(nextLang);
    await setPreferredLanguage(nextLang);
  };

  const handleClearHistory = () => {
    Alert.alert('Clear History', 'Are you sure you want to delete all chat history? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await deleteAllChats();
          Alert.alert('Success', 'Chat history cleared');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient colors={theme.headerGradient as any} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandWrap}>
            <View style={styles.brandIcon}>
              <Ionicons name="settings-outline" size={15} color={theme.accent} />
            </View>
            <Text style={styles.brandText}>Settings</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={theme.text} />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={theme.cardGradient as any} style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>{profile?.name?.charAt(0) || 'S'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.name || 'Shiksha Student'}</Text>
            <Text style={styles.profileGrade}>{profile?.grade || 'Class 8'} • {profile?.board || 'CBSE'}</Text>
          </View>
        </LinearGradient>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Academic Info</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert(
                'Select Your Class',
                'Choose your current class',
                CLASS_OPTIONS.map((cls) => ({
                  text: cls,
                  onPress: async () => {
                    await updateGrade(cls);
                    const updatedProfile = await getProfile();
                    setProfile(updatedProfile);
                  },
                })),
                { cancelable: true }
              );
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#17223F' : '#E7EEFF' }]}>
              <Ionicons name="school-outline" size={16} color={theme.accent} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>My Class</Text>
              <Text style={styles.settingHint}>{profile?.grade || 'Class 8'}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/model-manager')}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#2B1A45' : '#F3E8FF' }]}>
              <MaterialCommunityIcons name="brain" size={16} color="#A855F7" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Manage Study Models</Text>
              <Text style={styles.settingHint}>Download brains for offline tutor</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#17223F' : '#E7EEFF' }]}>
              <Ionicons name="cloud-offline-outline" size={16} color={theme.accent} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Offline Mode</Text>
              <Text style={styles.settingHint}>Use AI without internet</Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={handleOfflineToggle}
              trackColor={{ false: '#3A4255', true: '#7DA9FF' }}
              thumbColor={offlineMode ? '#FFFFFF' : '#D1D5DB'}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingItem} onPress={handleLanguageChange}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#3A2A12' : '#FFEDD5' }]}>
              <Ionicons name="language-outline" size={16} color="#F97316" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Preferred Language</Text>
              <Text style={styles.settingHint}>{preferredLang}</Text>
            </View>
            <MaterialIcons name="swap-horiz" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#173321' : '#DCFCE7' }]}>
              <Ionicons name="notifications-outline" size={16} color="#16A34A" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Study Reminders</Text>
              <Text style={styles.settingHint}>Daily learning prompts</Text>
            </View>
            <Switch value={true} trackColor={{ false: '#3A4255', true: '#7DA9FF' }} thumbColor="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Data Management</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingItem} onPress={handleClearHistory}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#3A1620' : '#FEE2E2' }]}>
              <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Clear Chat History</Text>
              <Text style={styles.settingHint}>Delete all past conversations</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.iconBox}>
              <Ionicons name="star-outline" size={16} color={theme.textMuted} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Rate Shiksha AI</Text>
              <Text style={styles.settingHint}>Support our development</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.iconBox}>
              <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingHint}>Build 2.0.4 - Premium</Text>
            </View>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn}>
          <MaterialIcons name="logout" size={18} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made for Class 8, 9 & 10 students</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.surface,
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
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    profileAvatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: theme.chipBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    profileGrade: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
    },
    scrollPadding: {
      padding: 16,
      paddingBottom: 30,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 10,
      marginTop: 16,
      marginLeft: 2,
    },
    card: {
      backgroundColor: theme.panel,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 8,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      minHeight: 52,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.panelSoft,
    },
    settingContent: {
      flex: 1,
      marginLeft: 10,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    settingHint: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
      fontWeight: '500',
    },
    versionText: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginHorizontal: 10,
    },
    signOutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(239,68,68,0.08)',
      marginTop: 20,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.25)',
      gap: 8,
    },
    signOutText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#EF4444',
    },
    footer: {
      marginTop: 16,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '600',
    },
  });
