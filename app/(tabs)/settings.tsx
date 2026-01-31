import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { deleteAllChats } from '@/storage/chatStore';
import { getOfflineMode, setOfflineMode, getPreferredLanguage, setPreferredLanguage } from '@/storage/settingsStore';
import { getProfile } from '@/storage/profileStore';
import { Colors, Spacing, BorderRadius, Fonts, Shadows } from '@/styles/designSystem';

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

export default function SettingsScreen() {
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
    // Basic cycling for demo, or show a picker
    const currentIndex = LANGUAGES.indexOf(preferredLang);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    const nextLang = LANGUAGES[nextIndex];
    
    setPreferredLang(nextLang);
    await setPreferredLanguage(nextLang);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all chat history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await deleteAllChats();
            Alert.alert('Success', 'Chat history cleared');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Text style={styles.avatarText}>{profile?.name?.charAt(0) || 'S'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name || 'Siksha Student'}</Text>
              <Text style={styles.profileGrade}>{profile?.grade || 'Class 9'} • {profile?.board || 'CBSE'}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="cloud-offline-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Offline Mode</Text>
              <Text style={styles.settingHint}>Use AI without internet</Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={handleOfflineToggle}
              trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
              thumbColor={offlineMode ? '#4F46E5' : '#CBD5E1'}
            />
          </View>
          
          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingItem} onPress={handleLanguageChange}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="language-outline" size={20} color="#F97316" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Preferred Language</Text>
              <Text style={styles.settingHint}>{preferredLang}</Text>
            </View>
            <MaterialIcons name="swap-horiz" size={20} color={Colors.gray400} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <View style={styles.settingItem}>
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="notifications-outline" size={20} color="#10B981" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Study Reminders</Text>
              <Text style={styles.settingHint}>Daily learning prompts</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
              thumbColor={'#4F46E5'}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Data Management</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingItem} onPress={handleClearHistory}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
              <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Clear Chat History</Text>
              <Text style={styles.settingHint}>Delete all past conversations</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.iconBox, { backgroundColor: '#F8FAFC' }]}>
              <Ionicons name="star-outline" size={20} color={Colors.gray600} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Rate Siksha AI</Text>
              <Text style={styles.settingHint}>Support our development</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.settingItem}>
            <View style={[styles.iconBox, { backgroundColor: '#F8FAFC' }]}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.gray600} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingHint}>Build 2.0.4 - Premium</Text>
            </View>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn}>
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for Class 9 & 10 students</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.white,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  profileGrade: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollPadding: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 24,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 8,
    ...Shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.gray900,
  },
  settingHint: {
    fontSize: 13,
    color: Colors.gray500,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  versionText: {
    fontSize: 14,
    color: Colors.gray400,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginHorizontal: 12,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginTop: 32,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  signOutText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#EF4444',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.gray400,
    fontFamily: Fonts.medium,
  },
});
