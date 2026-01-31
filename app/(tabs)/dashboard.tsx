import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DashboardService, DashboardStats } from '@/services/dashboardService';
import { AchievementService } from '@/services/achievementService';
import { getProfile } from '@/storage/profileStore';
import { Colors, Spacing, BorderRadius, Fonts, Shadows } from '@/styles/designSystem';

// Import data with fallback
let CLASS_9_SCIENCE: any[] = [];
let CLASS_9_SCIENCE_QUIZ: any[] = [];

try {
  const scienceData = require('@/data/class9Science');
  CLASS_9_SCIENCE = scienceData.CLASS_9_SCIENCE || [];
} catch (error) {
  console.error('Failed to load flashcard data:', error);
}

try {
  const quizData = require('@/data/class9ScienceQuiz');
  CLASS_9_SCIENCE_QUIZ = quizData.CLASS_9_SCIENCE_QUIZ || [];
} catch (error) {
  console.error('Failed to load quiz data:', error);
}

interface ChapterSummary {
  id: number;
  title: string;
  flashcards: number;
  quizQuestions: number;
  difficulty: string;
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [chapterSummaries, setChapterSummaries] = useState<ChapterSummary[]>([]);

  useEffect(() => {
    loadDashboardData();
    loadChapterSummaries();
  }, []);

  const loadChapterSummaries = () => {
    try {
      const summaries: ChapterSummary[] = [];
      
      if (!CLASS_9_SCIENCE || CLASS_9_SCIENCE.length === 0) return;

      CLASS_9_SCIENCE.forEach((chapter: any) => {
        if (!chapter || !chapter.id) return;
        
        const quizCount = CLASS_9_SCIENCE_QUIZ.filter((q: any) => q.chapter === chapter.id).length;
        const difficulties = CLASS_9_SCIENCE_QUIZ
          .filter((q: any) => q.chapter === chapter.id)
          .map((q: any) => q.difficulty);
        
        const difficultyBreakdown = {
          easy: difficulties.filter((d: string) => d === 'easy').length,
          medium: difficulties.filter((d: string) => d === 'medium').length,
          hard: difficulties.filter((d: string) => d === 'hard').length,
        };

        summaries.push({
          id: chapter.id,
          title: chapter.title,
          flashcards: chapter.cards?.length || 0,
          quizQuestions: quizCount,
          difficulty: `${difficultyBreakdown.easy}E • ${difficultyBreakdown.medium}M • ${difficultyBreakdown.hard}H`,
        });
      });

      setChapterSummaries(summaries);
    } catch (error) {
      console.error('Error loading chapter summaries:', error);
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const userProfile = await getProfile();
      setProfile(userProfile);
      
      const dashboardStats = await DashboardService.getDashboardStats('student_default');
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={['#6366F1', '#4F46E5']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.studentName}>{profile?.name || 'Academic Star'}</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="person-outline" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsBar}>
            <View style={styles.statBox}>
              <MaterialIcons name="local-fire-department" size={22} color="#FFD700" />
              <Text style={styles.statValue}>{stats?.streak || 0}</Text>
              <Text style={styles.statDesc}>Day Streak</Text>
            </View>
            <View style={[styles.statBox, styles.statDivider]}>
              <MaterialIcons name="stars" size={22} color="#FFD700" />
              <Text style={styles.statValue}>{stats?.totalPoints || 0}</Text>
              <Text style={styles.statDesc}>Total XP</Text>
            </View>
            <View style={styles.statBox}>
              <MaterialIcons name="emoji-events" size={22} color="#FFD700" />
              <Text style={styles.statValue}>#{stats?.rank || '12'}</Text>
              <Text style={styles.statDesc}>Leaderboard</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.searchWrapper}>
          <TouchableOpacity style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.gray400} />
            <Text style={styles.searchText}>Search notes, quizzes or chapters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="book" size={26} color="#6366F1" />
            </View>
            <Text style={styles.actionLabel}>Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="stats-chart" size={26} color="#10B981" />
            </View>
            <Text style={styles.actionLabel}>Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="chatbubbles" size={26} color="#F59E0B" />
            </View>
            <Text style={styles.actionLabel}>Ask AI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="flash" size={26} color="#EF4444" />
            </View>
            <Text style={styles.actionLabel}>Mistakes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <TouchableOpacity><Text style={styles.viewAll}>Resume</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.progressCard}>
            <View style={styles.progressIconBg}>
              <FontAwesome5 name="atom" size={28} color="#6366F1" />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressCategory}>SCIENCE • CHAPTER 3</Text>
              <Text style={styles.progressTitle}>Atoms and Molecules</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: '65%' }]} />
              </View>
              <View style={styles.progressMeta}>
                <Ionicons name="time-outline" size={14} color={Colors.gray500} />
                <Text style={styles.progressTime}>15 mins remaining</Text>
              </View>
            </View>
            <View style={styles.percentageCircle}>
              <Text style={styles.percentageText}>65%</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Subjects</Text>
          <View style={styles.subjectsGrid}>
            <TouchableOpacity 
              style={styles.subjectCard}
              onPress={() => setSelectedSubject('science')}
            >
              <LinearGradient
                colors={['#EEF2FF', '#E0E7FF']}
                style={styles.subjectIconWrap}
              >
                <FontAwesome5 name="microscope" size={24} color="#6366F1" />
              </LinearGradient>
              <Text style={styles.subjectCardLabel}>Science</Text>
              <Text style={styles.subjectMeta}>15 Chapters</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subjectCard}>
              <LinearGradient
                colors={['#F0FDF4', '#DCFCE7']}
                style={styles.subjectIconWrap}
              >
                <FontAwesome5 name="calculator" size={24} color="#10B981" />
              </LinearGradient>
              <Text style={styles.subjectCardLabel}>Maths</Text>
              <Text style={styles.subjectMeta}>12 Chapters</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subjectCard}>
              <LinearGradient
                colors={['#FFF7ED', '#FFEDD5']}
                style={styles.subjectIconWrap}
              >
                <FontAwesome5 name="history" size={24} color="#F59E0B" />
              </LinearGradient>
              <Text style={styles.subjectCardLabel}>History</Text>
              <Text style={styles.subjectMeta}>8 Chapters</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subjectCard}>
              <LinearGradient
                colors={['#FEF2F2', '#FEE2E2']}
                style={styles.subjectIconWrap}
              >
                <FontAwesome5 name="laptop-code" size={24} color="#EF4444" />
              </LinearGradient>
              <Text style={styles.subjectCardLabel}>IT</Text>
              <Text style={styles.subjectMeta}>6 Chapters</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.promoSection}>
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoCard}
          >
            <View style={styles.promoContent}>
              <Text style={styles.promoTag}>LIMITED OFFER</Text>
              <Text style={styles.promoTitle}>Unlock AI Tutor Pro</Text>
              <Text style={styles.promoDesc}>Get unlimited vision help and 24/7 exam support.</Text>
              <TouchableOpacity style={styles.promoButton}>
                <Text style={styles.promoButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.promoImage}>
              <FontAwesome5 name="rocket" size={60} color="rgba(255,255,255,0.3)" />
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Subject Detail Modal */}
      <Modal
        visible={selectedSubject === 'science'}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedSubject(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.modalHeaderModern}>
            <TouchableOpacity onPress={() => setSelectedSubject(null)}>
              <Ionicons name="chevron-back" size={28} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitleModern}>Science - Class 9</Text>
            <TouchableOpacity>
              <Ionicons name="search-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.chaptersContainer}>
              {chapterSummaries.map((chapter, idx) => (
                <TouchableOpacity key={idx} style={styles.chapterCardModern}>
                  <View style={styles.chapterCardTop}>
                    <View style={styles.chapterIdBox}>
                      <Text style={styles.chapterIdText}>{chapter.id < 10 ? `0${chapter.id}` : chapter.id}</Text>
                    </View>
                    <View style={styles.chapterInfoModern}>
                      <Text style={styles.chapterTitleModern}>{chapter.title}</Text>
                      <View style={styles.chapterBadges}>
                        <View style={[styles.badge, { backgroundColor: '#EEF2FF' }]}>
                          <Text style={[styles.badgeText, { color: '#6366F1' }]}>NCERT</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: '#F0FDF4' }]}>
                          <Text style={[styles.badgeText, { color: '#10B981' }]}>Class 9</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.chapterDivider} />

                  <View style={styles.chapterActionsModern}>
                    <View style={styles.chapAction}>
                      <View style={[styles.chapActionIcon, { backgroundColor: '#EEF2FF' }]}>
                        <MaterialIcons name="layers" size={22} color="#6366F1" />
                      </View>
                      <Text style={styles.chapActionLabel}>{chapter.flashcards}</Text>
                    </View>
                    <View style={styles.chapAction}>
                      <View style={[styles.chapActionIcon, { backgroundColor: '#F0FDF4' }]}>
                        <MaterialIcons name="quiz" size={22} color="#10B981" />
                      </View>
                      <Text style={styles.chapActionLabel}>{chapter.quizQuestions}</Text>
                    </View>
                    <TouchableOpacity style={styles.startBtn}>
                      <LinearGradient
                        colors={['#6366F1', '#4F46E5']}
                        style={styles.startBtnGradient}
                      >
                        <Text style={styles.startBtnText}>Start</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  studentName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  statDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  searchWrapper: {
    marginTop: -22,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    ...Colors.cardShadow as any,
  },
  searchText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: Colors.gray400,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 30,
  },
  actionItem: {
    alignItems: 'center',
    width: '22%',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Colors.cardShadow as any,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray700,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.gray900,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Colors.cardShadow as any,
  },
  progressIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressInfo: {
    flex: 1,
    marginLeft: 16,
  },
  progressCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.5,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray900,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    marginTop: 10,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  progressTime: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: '500',
  },
  percentageCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6366F1',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  subjectCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    ...Colors.cardShadow as any,
  },
  subjectIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectCardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray900,
  },
  subjectMeta: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 4,
  },
  promoSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  promoCard: {
    borderRadius: 32,
    flexDirection: 'row',
    padding: 24,
    overflow: 'hidden',
  },
  promoContent: {
    flex: 2,
  },
  promoTag: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  promoTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  promoDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  promoButton: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 18,
  },
  promoButtonText: {
    color: '#6D28D9',
    fontWeight: '800',
    fontSize: 13,
  },
  promoImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeaderModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  modalTitleModern: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  modalContent: {
    padding: 24,
  },
  chaptersContainer: {
    gap: 16,
  },
  chapterCardModern: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    ...Colors.cardShadow as any,
  },
  chapterCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterIdBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterIdText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.gray400,
  },
  chapterInfoModern: {
    flex: 1,
    marginLeft: 16,
  },
  chapterTitleModern: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.gray900,
  },
  chapterBadges: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  chapterDivider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginVertical: 16,
  },
  chapterActionsModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chapAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chapActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapActionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray700,
  },
  startBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  startBtnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
});
