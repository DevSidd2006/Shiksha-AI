import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Switch,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getProfile, updateProfile } from '@/storage/profileStore';
import { Colors, Fonts, Shadows, Spacing, BorderRadius } from '@/styles/designSystem';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            // We should clear the store here in a real app
            router.replace('/');
          }
        },
      ]
    );
  };

  const STATS = [
    { label: 'Chapters', value: '12', icon: 'book', color: '#6366F1' },
    { label: 'Quizzes', value: '45', icon: 'check-circle', color: '#10B981' },
    { label: 'Streak', value: '7', icon: 'fire', color: '#F59E0B' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#6366F1', '#4F46E5']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                </Text>
              </View>
              <TouchableOpacity style={styles.editAvatarBtn}>
                <Ionicons name="camera" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{profile?.name || 'Student'}</Text>
            <Text style={styles.userGrade}>{profile?.grade || 'Class 9'}</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Stats Section */}
          <View style={styles.statsCard}>
            {STATS.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <View style={[styles.statIconBg, { backgroundColor: stat.color + '20' }]}>
                  <FontAwesome5 name={stat.icon} size={18} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Settings Section */}
          <Text style={styles.sectionTitle}>Learning Preferences</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconBg, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="notifications" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                thumbColor={notifications ? Colors.primary : '#F8FAFC'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconBg, { backgroundColor: '#F0FDF4' }]}>
                  <MaterialIcons name="alarm" size={20} color={Colors.success} />
                </View>
                <Text style={styles.settingLabel}>Study Reminders</Text>
              </View>
              <Switch
                value={studyReminders}
                onValueChange={setStudyReminders}
                trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                thumbColor={studyReminders ? Colors.primary : '#F8FAFC'}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Account & App</Text>
          <View style={styles.settingsGroup}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconBg, { backgroundColor: '#F8FAFC' }]}>
                  <Ionicons name="settings" size={20} color={Colors.gray600} />
                </View>
                <Text style={styles.settingLabel}>App Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/history')}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconBg, { backgroundColor: '#F8FAFC' }]}>
                  <Ionicons name="time" size={20} color={Colors.gray600} />
                </View>
                <Text style={styles.settingLabel}>Chat History</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notes')}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconBg, { backgroundColor: '#F8FAFC' }]}>
                  <Ionicons name="document-text" size={20} color={Colors.gray600} />
                </View>
                <Text style={styles.settingLabel}>My Study Notes</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconBg, { backgroundColor: '#F8FAFC' }]}>
                  <Ionicons name="person" size={20} color={Colors.gray600} />
                </View>
                <Text style={styles.settingLabel}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconBg, { backgroundColor: '#F8FAFC' }]}>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.gray600} />
                </View>
                <Text style={styles.settingLabel}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconBg, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="log-out" size={20} color={Colors.error} />
                </View>
                <Text style={[styles.settingLabel, { color: Colors.error }]}>Log Out</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Shiksha AI v1.0.0</Text>
            <Text style={styles.versionText}>Made with ❤️ for students</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 40,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366F1',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4F46E5',
    elevation: 4,
  },
  userName: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  userGrade: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    padding: 20,
    marginTop: -30,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    ...Shadows.md,
    marginBottom: 25,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.gray800,
    marginBottom: 15,
    marginLeft: 5,
  },
  settingsGroup: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 10,
    marginBottom: 25,
    ...Shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.gray800,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: Colors.gray400,
    lineHeight: 18,
  },
});
