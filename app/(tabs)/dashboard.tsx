import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { DashboardService, DashboardStats } from '@/features/progress';
import { getProfile } from '@/features/user';
import { useAppTheme } from '@/shared';

let CLASS_9_SCIENCE: any[] = [];
let CLASS_9_SCIENCE_QUIZ: any[] = [];

try {
  const contentData = require('@/features/content');
  CLASS_9_SCIENCE = contentData.CLASS_9_SCIENCE || [];
  CLASS_9_SCIENCE_QUIZ = contentData.CLASS_9_SCIENCE_QUIZ || [];
} catch (error) {
  console.error('Failed to load content data:', error);
}

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
  primaryButton: string;
  primaryButtonText: string;
  iconChip: string;
}

const darkTheme: ThemePalette = {
  surface: '#06070B',
  panel: '#11131A',
  panelSoft: '#191D27',
  border: 'rgba(255,255,255,0.08)',
  text: '#F7F9FF',
  textMuted: '#9AA5BD',
  accent: '#2DDCFF',
  headerGradient: ['#0C1020', '#11131A'],
  cardGradient: ['#151A27', '#10131A'],
  primaryButton: '#FFFFFF',
  primaryButtonText: '#0A0C13',
  iconChip: '#1E2A52',
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
  primaryButton: '#10182D',
  primaryButtonText: '#FFFFFF',
  iconChip: '#E4ECFF',
};

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { mode: themeMode, toggleTheme } = useAppTheme();

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const chapterCount = CLASS_9_SCIENCE.length;
  const quizCount = CLASS_9_SCIENCE_QUIZ.length;
  const flashcardCount = CLASS_9_SCIENCE.reduce(
    (sum, chapter) => sum + (chapter.cards?.length || 0),
    0
  );

  const activeChapter = CLASS_9_SCIENCE[0];

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [userProfile, dashboardStats] = await Promise.all([
        getProfile(),
        DashboardService.getDashboardStats('student_default'),
      ]);

      setProfile(userProfile);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const userName = profile?.name || 'Student';
  const grade = profile?.grade || 'Class 8';
  const mastery = Math.max(0, Math.min(100, stats?.accuracy || 75));
  const completedTopics = stats?.topics?.length || 0;
  const dailyGoal = stats?.dailyGoal || 5;
  const todayQuestions = stats?.todayQuestions || 0;
  const dailyProgress = Math.max(0, Math.min(100, Math.round((todayQuestions / dailyGoal) * 100)));
  const streak = stats?.currentStreak || 0;
  const points = stats?.totalPoints || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient colors={theme.headerGradient as any} style={styles.headerShell}>
          <View style={styles.headerTopRow}>
            <View style={styles.brandWrap}>
              <View style={styles.brandIcon}>
                <Ionicons name="school" size={16} color={theme.accent} />
              </View>
              <Text style={styles.brandText}>Shiksha AI</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconAction}
                onPress={toggleTheme}
              >
                <Ionicons
                  name={themeMode === 'dark' ? 'sunny' : 'moon'}
                  size={16}
                  color={theme.text}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconAction} onPress={() => router.push('/settings')}>
                <Ionicons name="notifications-outline" size={16} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          <LinearGradient colors={theme.cardGradient as any} style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome back, {userName}! 👋</Text>
            <Text style={styles.welcomeSubtext}>
              Learn smarter today. You have {completedTopics} mastered topics and a fresh mission waiting.
            </Text>

            <View style={styles.goalWrap}>
              <View style={styles.goalRingOuter}>
                <View style={[styles.goalRingInner, { borderColor: theme.panel }]}> 
                  <Text style={styles.goalPercent}>{mastery}%</Text>
                  <Text style={styles.goalCaption}>GOAL</Text>
                </View>
              </View>
            </View>

            <View style={styles.heroStatRow}>
              <View style={styles.heroStatChip}>
                <Ionicons name="flame-outline" size={13} color={theme.accent} />
                <Text style={styles.heroStatText}>{streak} day streak</Text>
              </View>
              <View style={styles.heroStatChip}>
                <Ionicons name="sparkles-outline" size={13} color={theme.accent} />
                <Text style={styles.heroStatText}>{points} points</Text>
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Mission</Text>
        </View>

        <View style={styles.missionCard}>
          <View style={styles.missionHeader}>
            <MaterialIcons name="rocket-launch" size={16} color={theme.accent} />
            <Text style={styles.missionTitle}>Complete your daily target</Text>
          </View>
          <Text style={styles.missionSubtitle}>
            Solve at least {dailyGoal} questions to maintain your learning streak.
          </Text>
          <View style={styles.pathProgressTrack}>
            <View style={[styles.pathProgressFill, { width: `${dailyProgress}%` }]} />
          </View>
          <View style={styles.missionSteps}>
            <Text style={styles.missionStep}>1. Read Chapter 1 summary</Text>
            <Text style={styles.missionStep}>2. Ask AI 2 doubts</Text>
            <Text style={styles.missionStep}>3. Finish one quiz set</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Learning Path</Text>
        </View>

        <LinearGradient colors={theme.cardGradient as any} style={styles.pathCard}>
          <View style={styles.pathBanner}>
            <FontAwesome5 name="atom" size={30} color={theme.accent} />
          </View>
          <View style={styles.pathMetaRow}>
            <Text style={styles.inProgressBadge}>IN PROGRESS</Text>
          </View>
          <Text style={styles.pathTitle}>{grade} Science: {activeChapter?.title || 'Matter in Our Surroundings'}</Text>
          <Text style={styles.pathDescription}>Start with structured roadmap in Notes, then practice using Flashcards and Quiz.</Text>
          <View style={styles.pathProgressTrack}>
            <View style={[styles.pathProgressFill, { width: `${mastery}%` }]} />
          </View>

          <View style={styles.pathActions}>
            <TouchableOpacity style={styles.primaryAction} onPress={() => router.push('/flashcards')}>
              <Text style={styles.primaryActionText}>Continue Learning</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.primaryButtonText} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push('/notes')}>
              <Text style={styles.secondaryActionText}>Curriculum Map</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick AI Tools</Text>
        </View>

        <View style={styles.toolsGrid}>
          <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/quiz')}>
            <View style={[styles.toolIconWrap, { backgroundColor: '#DCE6FF' }]}>
              <Ionicons name="help-circle-outline" size={16} color="#1E40AF" />
            </View>
            <Text style={styles.toolTitle}>Generate Quiz</Text>
            <Text style={styles.toolSubtitle}>Turn your notes into a practice test instantly.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/notes')}>
            <View style={[styles.toolIconWrap, { backgroundColor: '#DDF9EE' }]}>
              <Ionicons name="document-text-outline" size={16} color="#047857" />
            </View>
            <Text style={styles.toolTitle}>Summarize Notes</Text>
            <Text style={styles.toolSubtitle}>Get key takeaways from any document or PDF.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/tutor')}>
            <View style={[styles.toolIconWrap, { backgroundColor: '#FFEBC8' }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#92400E" />
            </View>
            <Text style={styles.toolTitle}>Ask AI Assistant</Text>
            <Text style={styles.toolSubtitle}>Get a specific question answered instantly.</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerStats}>
          <View style={styles.footerStatBox}>
            <Text style={styles.footerStatValue}>{chapterCount}</Text>
            <Text style={styles.footerStatLabel}>Chapters</Text>
          </View>
          <View style={styles.footerStatBox}>
            <Text style={styles.footerStatValue}>{flashcardCount}</Text>
            <Text style={styles.footerStatLabel}>Flashcards</Text>
          </View>
          <View style={styles.footerStatBox}>
            <Text style={styles.footerStatValue}>{quizCount}</Text>
            <Text style={styles.footerStatLabel}>Quiz Qs</Text>
          </View>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.surface,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 28,
    },
    headerShell: {
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      paddingBottom: 10,
    },
    brandWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    brandIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.iconChip,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    brandText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '800',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconAction: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    welcomeCard: {
      marginTop: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
    },
    welcomeTitle: {
      color: theme.text,
      fontSize: 30,
      lineHeight: 34,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    welcomeSubtext: {
      marginTop: 8,
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
    },
    masteryRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    masteryAvatars: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panelSoft,
    },
    avatarOverlap: {
      marginLeft: -6,
    },
    masteryLabel: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    goalWrap: {
      marginTop: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
    },
    goalRingOuter: {
      width: 118,
      height: 118,
      borderRadius: 59,
      borderWidth: 8,
      borderColor: theme.accent,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightColor: theme.panelSoft,
    },
    goalRingInner: {
      width: 86,
      height: 86,
      borderRadius: 43,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    goalPercent: {
      color: theme.text,
      fontSize: 34,
      fontWeight: '800',
      lineHeight: 36,
    },
    goalCaption: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
    },
    heroStatRow: {
      marginTop: 12,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
    },
    heroStatChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.panel,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    heroStatText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '700',
    },
    sectionHeader: {
      marginTop: 14,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    sectionHeaderRow: {
      marginTop: 18,
      paddingHorizontal: 16,
      marginBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    sectionAction: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: '700',
    },
    missionCard: {
      marginHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel,
      padding: 12,
    },
    missionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    missionTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
    },
    missionSubtitle: {
      marginTop: 6,
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '500',
    },
    missionSteps: {
      marginTop: 10,
      gap: 4,
    },
    missionStep: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '600',
    },
    pathCard: {
      marginHorizontal: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
    },
    pathBanner: {
      height: 110,
      borderRadius: 12,
      backgroundColor: '#092319',
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pathMetaRow: {
      marginTop: 10,
    },
    inProgressBadge: {
      alignSelf: 'flex-start',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: '#7A4A00',
      backgroundColor: '#FFE7C2',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    pathTitle: {
      marginTop: 10,
      color: theme.text,
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    pathDescription: {
      marginTop: 6,
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
    },
    pathProgressTrack: {
      marginTop: 10,
      height: 6,
      borderRadius: 999,
      backgroundColor: theme.panelSoft,
      overflow: 'hidden',
    },
    pathProgressFill: {
      height: '70%',
      backgroundColor: theme.accent,
      borderRadius: 999,
    },
    pathActions: {
      marginTop: 12,
      flexDirection: 'row',
      gap: 8,
    },
    primaryAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 42,
      borderRadius: 10,
      backgroundColor: theme.primaryButton,
    },
    primaryActionText: {
      color: theme.primaryButtonText,
      fontSize: 14,
      fontWeight: '800',
    },
    secondaryAction: {
      minWidth: 120,
      height: 42,
      borderRadius: 10,
      backgroundColor: theme.panelSoft,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    secondaryActionText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '700',
    },
    toolsGrid: {
      paddingHorizontal: 16,
      gap: 8,
    },
    toolCard: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 12,
    },
    toolIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    toolTitle: {
      marginTop: 8,
      color: theme.text,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    toolSubtitle: {
      marginTop: 4,
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 17,
    },
    footerStats: {
      marginTop: 14,
      marginHorizontal: 16,
      flexDirection: 'row',
      backgroundColor: theme.panel,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 10,
    },
    footerStatBox: {
      flex: 1,
      alignItems: 'center',
    },
    footerStatValue: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '800',
    },
    footerStatLabel: {
      marginTop: 2,
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },
  });
