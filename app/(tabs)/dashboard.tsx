import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DashboardService, DashboardStats } from '@/features/progress';
import { getProfile } from '@/features/user';
import { useAppTheme } from '@/shared';
import { DARK_THEME, LIGHT_THEME, AppTheme, Spacing, BorderRadius } from '@/shared';

let CLASS_9_SCIENCE: any[] = [];
let CLASS_9_SCIENCE_QUIZ: any[] = [];

try {
  const contentData = require('@/features/content');
  CLASS_9_SCIENCE = contentData.CLASS_9_SCIENCE || [];
  CLASS_9_SCIENCE_QUIZ = contentData.CLASS_9_SCIENCE_QUIZ || [];
} catch (error) {
  console.error('Failed to load content data:', error);
}

// Quick-action cards
const QUICK_ACTIONS = [
  { id: 'tutor',    label: 'Ask AI',       icon: 'robot-outline',        route: '/tutor',      color: '#818CF8', bg: '#EEF2FF' },
  { id: 'quiz',     label: 'Quiz',         icon: 'help-circle-outline',  route: '/quiz',       color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'flash',    label: 'Flashcards',   icon: 'layers-outline',       route: '/flashcards', color: '#10B981', bg: '#ECFDF5' },
  { id: 'progress', label: 'Progress',     icon: 'analytics-outline',    route: '/progress',   color: '#EC4899', bg: '#FDF2F8' },
] as const;

export default function DashboardScreen() {
  const router = useRouter();
  const { mode: themeMode, toggleTheme } = useAppTheme();
  const isDark = themeMode === 'dark';
  const theme: AppTheme = isDark ? DARK_THEME : LIGHT_THEME;
  const styles = useMemo(() => createStyles(theme, isDark), [theme]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnims = useRef(QUICK_ACTIONS.map(() => new Animated.Value(0))).current;

  const chapterCount    = CLASS_9_SCIENCE.length;
  const quizCount       = CLASS_9_SCIENCE_QUIZ.length;
  const flashcardCount  = CLASS_9_SCIENCE.reduce((s: number, c: any) => s + (c.cards?.length || 0), 0);
  const activeChapter   = CLASS_9_SCIENCE[0];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prof, dashStats] = await Promise.all([
        getProfile(),
        DashboardService.getDashboardStats('student_default'),
      ]);
      setProfile(prof);
      setStats(dashStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (loading) return;

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    // Staggered card pop-in
    scaleAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: i * 60,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }).start();
    });

    // Goal ring gentle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, [loading]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.surface }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading your goals…</Text>
      </View>
    );
  }

  const userName        = profile?.name || 'Student';
  const firstInitial    = userName.charAt(0).toUpperCase();
  const grade           = profile?.grade || 'Class 9';
  const mastery         = Math.max(0, Math.min(100, stats?.accuracy || 75));
  const todayQuestions  = stats?.todayQuestions || 0;
  const dailyGoal       = stats?.dailyGoal || 5;
  const dailyPct        = Math.round((todayQuestions / dailyGoal) * 100);
  const streak          = stats?.currentStreak || 0;
  const points          = stats?.totalPoints || 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={theme.accent} />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Top bar ──────────────────────────────────────────────────── */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>{firstInitial}</Text>
              </View>
              <View>
                <Text style={styles.greetingSmall}>Good {greeting()},</Text>
                <Text style={styles.greetingName}>{userName} 👋</Text>
              </View>
            </View>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
                <Ionicons name="settings-outline" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Hero card: streak + goal ring ───────────────────────────── */}
          <LinearGradient
            colors={isDark ? ['#1C2040', '#131729'] : ['#6366F1', '#818CF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Decorative blobs */}
            <View style={styles.heroBlob1} />
            <View style={styles.heroBlob2} />

            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={14} color="#FB923C" />
                  <Text style={styles.streakBadgeText}>{streak} day streak</Text>
                </View>
                <Text style={styles.heroTitle}>Keep up the{'\n'}great work! 🚀</Text>
                <Text style={styles.heroSub}>
                  {points} XP · {grade} · {Math.min(dailyPct, 100)}% today
                </Text>

                <TouchableOpacity
                  style={styles.heroCta}
                  onPress={() => router.push('/tutor')}
                >
                  <Text style={styles.heroCtaText}>Continue Learning</Text>
                  <Ionicons name="arrow-forward" size={16} color="#6366F1" />
                </TouchableOpacity>
              </View>

              {/* Goal ring */}
              <Animated.View style={[styles.ringWrap, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.ringOuter}>
                  <View style={[styles.ringInner, { borderColor: isDark ? '#1C2040' : '#6366F1' }]}>
                    <Text style={styles.ringPct}>{mastery}%</Text>
                    <Text style={styles.ringLabel}>MASTERY</Text>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Today's progress bar */}
            <View style={styles.todayBar}>
              <View style={styles.todayBarTrack}>
                <View style={[styles.todayBarFill, { width: `${Math.min(dailyPct, 100)}%` }]} />
              </View>
              <Text style={styles.todayBarLabel}>{todayQuestions}/{dailyGoal} today</Text>
            </View>
          </LinearGradient>

          {/* ── Quick actions grid ───────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Quick Actions</Text>
          <View style={styles.qaGrid}>
            {QUICK_ACTIONS.map((qa, i) => (
              <Animated.View key={qa.id} style={{ transform: [{ scale: scaleAnims[i] }], width: '48%' }}>
                <TouchableOpacity
                  style={[styles.qaCard, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
                  onPress={() => router.push(qa.route as any)}
                  activeOpacity={0.82}
                >
                  <View style={[styles.qaIcon, { backgroundColor: isDark ? theme.chipBg : qa.bg }]}>
                    <Ionicons name={qa.icon as any} size={22} color={isDark ? theme.accent : qa.color} />
                  </View>
                  <Text style={styles.qaLabel}>{qa.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* ── Active learning path ─────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Active Path</Text>
          <LinearGradient
            colors={theme.cardGradient as any}
            style={styles.pathCard}
          >
            <View style={styles.pathTopRow}>
              <View style={styles.inProgressBadge}>
                <View style={styles.inProgressDot} />
                <Text style={styles.inProgressText}>IN PROGRESS</Text>
              </View>
              <Text style={styles.pathChapter}>{grade}</Text>
            </View>

            <Text style={styles.pathTitle}>
              {activeChapter?.title || 'Matter in Our Surroundings'}
            </Text>
            <Text style={styles.pathDesc}>
              Notes → Flashcards → Quiz. Stay on the path to master this chapter.
            </Text>

            <View style={styles.pathTrack}>
              <View style={[styles.pathFill, { width: `${mastery}%` }]} />
            </View>
            <Text style={styles.pathPct}>{mastery}% complete</Text>

            <View style={styles.pathActions}>
              <TouchableOpacity
                style={[styles.pathPrimaryBtn, { backgroundColor: theme.buttonBg }]}
                onPress={() => router.push('/flashcards')}
              >
                <Text style={[styles.pathPrimaryText, { color: theme.buttonText }]}>Continue</Text>
                <Ionicons name="arrow-forward" size={15} color={theme.buttonText} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.pathSecBtn} onPress={() => router.push('/notes' as any)}>
                <Ionicons name="document-text-outline" size={15} color={theme.textMuted} />
                <Text style={styles.pathSecText}>Notes</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* ── Footer stats ─────────────────────────────────────────────── */}
          <View style={styles.footerStats}>
            {[
              { label: 'Chapters',   value: chapterCount,   icon: 'book-outline' },
              { label: 'Flashcards', value: flashcardCount, icon: 'layers-outline' },
              { label: 'Quiz Qs',    value: quizCount,      icon: 'help-circle-outline' },
            ].map((s) => (
              <View key={s.label} style={styles.footerStat}>
                <Ionicons name={s.icon as any} size={14} color={theme.accent} />
                <Text style={styles.footerStatVal}>{s.value}</Text>
                <Text style={styles.footerStatLbl}>{s.label}</Text>
              </View>
            ))}
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function createStyles(theme: AppTheme, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.surface },
    scroll: { paddingBottom: 32 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14, fontWeight: '600' },

    // Top bar
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: 10,
      paddingBottom: 14,
    },
    topBarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
    topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatarBadge: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: isDark ? '#1C2540' : '#6366F1',
      justifyContent: 'center', alignItems: 'center',
    },
    avatarBadgeText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
    greetingSmall: { color: theme.textMuted, fontSize: 12, fontWeight: '600' },
    greetingName:  { color: theme.text, fontSize: 17, fontWeight: '800' },
    iconBtn: {
      width: 36, height: 36, borderRadius: 12,
      backgroundColor: theme.panel,
      borderWidth: 1, borderColor: theme.border,
      justifyContent: 'center', alignItems: 'center',
    },

    // Hero card
    heroCard: {
      marginHorizontal: Spacing.lg,
      borderRadius: 24,
      padding: 20,
      overflow: 'hidden',
    },
    heroBlob1: {
      position: 'absolute', top: -30, right: -20,
      width: 130, height: 130, borderRadius: 65,
      backgroundColor: 'rgba(255,255,255,0.07)',
    },
    heroBlob2: {
      position: 'absolute', bottom: -20, left: 60,
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    streakBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
      alignSelf: 'flex-start', marginBottom: 10,
    },
    streakBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 6 },
    heroSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginBottom: 14 },
    heroCta: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 999, alignSelf: 'flex-start',
    },
    heroCtaText: { color: '#6366F1', fontSize: 13, fontWeight: '800' },

    // Ring
    ringWrap: { alignItems: 'center', justifyContent: 'center' },
    ringOuter: {
      width: 90, height: 90, borderRadius: 45,
      borderWidth: 7, borderColor: 'rgba(255,255,255,0.6)',
      justifyContent: 'center', alignItems: 'center',
    },
    ringInner: {
      width: 66, height: 66, borderRadius: 33,
      borderWidth: 1, justifyContent: 'center', alignItems: 'center',
    },
    ringPct:   { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
    ringLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },

    // Today bar
    todayBar: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
    todayBarTrack: {
      flex: 1, height: 6, borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.2)',
      overflow: 'hidden',
    },
    todayBarFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 999 },
    todayBarLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', minWidth: 60, textAlign: 'right' },

    // Section label
    sectionLabel: {
      color: theme.text,
      fontSize: 16, fontWeight: '800',
      marginHorizontal: Spacing.lg,
      marginTop: 22, marginBottom: 10,
    },

    // Quick-actions grid
    qaGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      paddingHorizontal: Spacing.lg, gap: 10,
    },
    qaCard: {
      backgroundColor: theme.panel,
      borderRadius: 18,
      borderWidth: 1,
      padding: 14,
      alignItems: 'flex-start',
      gap: 10,
    },
    qaIcon: {
      width: 44, height: 44, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center',
    },
    qaLabel: { color: theme.text, fontSize: 14, fontWeight: '800' },

    // Learning path
    pathCard: {
      marginHorizontal: Spacing.lg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
    },
    pathTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    inProgressBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : '#FEF3C7',
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    },
    inProgressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' },
    inProgressText: { color: isDark ? '#FBBF24' : '#92400E', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    pathChapter: { color: theme.textMuted, fontSize: 12, fontWeight: '700' },
    pathTitle: { color: theme.text, fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 6 },
    pathDesc:  { color: theme.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 12 },
    pathTrack: {
      height: 7, borderRadius: 999,
      backgroundColor: theme.panelSoft, overflow: 'hidden', marginBottom: 4,
    },
    pathFill:  { height: '100%', backgroundColor: theme.accent, borderRadius: 999 },
    pathPct:   { color: theme.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 14 },
    pathActions: { flexDirection: 'row', gap: 8 },
    pathPrimaryBtn: {
      flex: 1, height: 42, borderRadius: 12,
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    },
    pathPrimaryText: { fontSize: 14, fontWeight: '800' },
    pathSecBtn: {
      height: 42, borderRadius: 12,
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14,
      backgroundColor: theme.panelSoft,
      borderWidth: 1, borderColor: theme.border,
    },
    pathSecText: { color: theme.textMuted, fontSize: 13, fontWeight: '700' },

    // Footer stats
    footerStats: {
      marginHorizontal: Spacing.lg,
      marginTop: 18,
      flexDirection: 'row',
      backgroundColor: theme.panel,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 14,
    },
    footerStat:    { flex: 1, alignItems: 'center', gap: 3 },
    footerStatVal: { color: theme.text, fontSize: 18, fontWeight: '800' },
    footerStatLbl: { color: theme.textMuted, fontSize: 11, fontWeight: '600' },
  });
}
