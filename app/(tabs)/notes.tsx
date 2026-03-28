import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/shared';

let CLASS_9_SCIENCE_NOTES: any[] = [];
let getChapterNotes: any = () => undefined;
let getAllCategories: any = () => [];

try {
  const notesData = require('@/features/content');
  CLASS_9_SCIENCE_NOTES = notesData.CLASS_9_SCIENCE_NOTES || [];
  getChapterNotes = notesData.getChapterNotes || (() => undefined);
  getAllCategories = notesData.getAllCategories || (() => []);
} catch (error) {
  console.error('Failed to load notes data:', error);
}

interface Chapter {
  id: number;
  title: string;
}

interface NotePoint {
  id: string;
  title: string;
  content: string;
  category: string;
  icon: string;
}

interface ChapterData {
  chapterTitle: string;
  introduction: string;
  studyRoadmap?: {
    stage: string;
    focus: string;
    actions: string[];
    checkpoint: string;
  }[];
  points: NotePoint[];
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

export default function NotesScreen() {
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const chapters: Chapter[] = [
    { id: 1, title: 'Matter in Our Surroundings' },
    { id: 2, title: 'Is Matter Around Us Pure?' },
    { id: 3, title: 'Atoms and Molecules' },
  ];

  useEffect(() => {
    if (selectedChapter) {
      const cats = getAllCategories(selectedChapter);
      setCategories(cats);
      setSelectedCategory(cats[0] || null);
    }
  }, [selectedChapter]);

  if (!selectedChapter) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <LinearGradient colors={theme.headerGradient as any} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandWrap}>
              <View style={styles.brandIcon}>
                <Ionicons name="document-text-outline" size={15} color={theme.accent} />
              </View>
              <Text style={styles.brandText}>Notes</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={theme.text} />
            </TouchableOpacity>
          </View>

          <LinearGradient colors={theme.cardGradient as any} style={styles.heroCard}>
            <Text style={styles.heroTitle}>Class 9 Science Notes</Text>
            <Text style={styles.heroSubtitle}>Choose a chapter and revise key concepts quickly.</Text>
          </LinearGradient>
        </LinearGradient>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Select a Chapter</Text>
          {chapters.map((chapter) => (
            <TouchableOpacity key={chapter.id} style={styles.chapterCard} onPress={() => setSelectedChapter(chapter.id)}>
              <View style={styles.chapterIconBox}>
                <FontAwesome5 name="book-open" size={14} color={theme.accent} />
              </View>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                <Text style={styles.chapterPoints}>
                  {CLASS_9_SCIENCE_NOTES[chapter.id - 1]?.points.length || 0} Key Concepts
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const chapterData = getChapterNotes(selectedChapter) as ChapterData | undefined;

  if (!chapterData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Chapter not found</Text>
      </SafeAreaView>
    );
  }

  const filteredPoints = selectedCategory
    ? chapterData.points.filter((p: NotePoint) => p.category === selectedCategory)
    : chapterData.points;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient colors={theme.headerGradient as any} style={styles.headerCompact}>
        <View style={styles.headerCompactRow}>
          <TouchableOpacity onPress={() => setSelectedChapter(null)} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerSubtitleCompact}>Chapter {selectedChapter}</Text>
            <Text style={styles.headerTitleCompact} numberOfLines={1}>{chapterData.chapterTitle}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.cardGradient as any} style={styles.introCard}>
          <View style={styles.introHeader}>
            <Ionicons name="information-circle-outline" size={16} color={theme.accent} />
            <Text style={styles.introTitle}>Quick Overview</Text>
          </View>
          <Text style={styles.introText}>{chapterData.introduction}</Text>
        </LinearGradient>

        {chapterData.studyRoadmap && chapterData.studyRoadmap.length > 0 && (
          <View style={styles.roadmapContainer}>
            <Text style={styles.sectionTitleSmall}>Structured Learning Path</Text>
            {chapterData.studyRoadmap.map((step, idx) => (
              <View key={`${step.stage}-${idx}`} style={styles.roadmapCard}>
                <View style={styles.roadmapHeader}>
                  <View style={styles.roadmapStepBadge}>
                    <Text style={styles.roadmapStepBadgeText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roadmapStage}>{step.stage}</Text>
                    <Text style={styles.roadmapFocus}>{step.focus}</Text>
                  </View>
                </View>

                <View style={styles.roadmapActionsList}>
                  {step.actions.map((action, actionIdx) => (
                    <View key={`${step.stage}-action-${actionIdx}`} style={styles.roadmapActionRow}>
                      <Text style={styles.roadmapActionBullet}>•</Text>
                      <Text style={styles.roadmapActionText}>{action}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.checkpointBox}>
                  <Text style={styles.checkpointTitle}>Checkpoint</Text>
                  <Text style={styles.checkpointText}>{step.checkpoint}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.categoryContainer}>
          <Text style={styles.sectionTitleSmall}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryButtonTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.sectionTitleSmall}>
            {selectedCategory ? `${selectedCategory} (${filteredPoints.length})` : `All Points (${chapterData.points.length})`}
          </Text>

          {filteredPoints.map((point: NotePoint) => (
            <View key={point.id} style={styles.pointCard}>
              <View style={styles.pointHeader}>
                <View style={styles.pointIconCircle}>
                  <Text style={styles.pointIcon}>{point.icon}</Text>
                </View>
                <View style={styles.pointTitleContainer}>
                  <Text style={styles.pointTitle}>{point.title}</Text>
                  <View style={styles.pointTag}>
                    <Text style={styles.pointTagText}>{point.category}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.pointContent}>{point.content}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 34 }} />
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
    heroCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 8,
    },
    heroTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '800',
    },
    heroSubtitle: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: '500',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 10,
    },
    chapterCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chapterIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      backgroundColor: theme.chipBg,
    },
    chapterInfo: {
      flex: 1,
    },
    chapterTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    chapterPoints: {
      fontSize: 12,
      color: theme.textMuted,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
      marginTop: 40,
      fontWeight: '600',
    },
    headerCompact: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerCompactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingTop: 4,
    },
    headerContent: {
      flex: 1,
    },
    headerTitleCompact: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    headerSubtitleCompact: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '600',
      marginBottom: 2,
    },
    introCard: {
      borderRadius: 14,
      padding: 14,
      marginHorizontal: 16,
      marginTop: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    introHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    introTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.accent,
      letterSpacing: 0.4,
    },
    introText: {
      fontSize: 13,
      color: theme.textMuted,
      lineHeight: 20,
      fontWeight: '500',
    },
    roadmapContainer: {
      paddingHorizontal: 16,
      marginBottom: 14,
      gap: 10,
    },
    roadmapCard: {
      backgroundColor: theme.panel,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 10,
    },
    roadmapHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    roadmapStepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.chipBg,
    },
    roadmapStepBadgeText: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: '800',
    },
    roadmapStage: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 2,
    },
    roadmapFocus: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '500',
    },
    roadmapActionsList: {
      gap: 6,
    },
    roadmapActionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    roadmapActionBullet: {
      color: theme.accent,
      fontSize: 14,
      marginTop: 1,
    },
    roadmapActionText: {
      flex: 1,
      color: theme.text,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '500',
    },
    checkpointBox: {
      backgroundColor: theme.panelSoft,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 10,
      gap: 4,
    },
    checkpointTitle: {
      color: theme.accent,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    checkpointText: {
      color: theme.text,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '500',
    },
    categoryContainer: {
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    sectionTitleSmall: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 10,
    },
    categoryContent: {
      gap: 8,
      paddingRight: 12,
    },
    categoryButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
    },
    categoryButtonActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    categoryButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textMuted,
    },
    categoryButtonTextActive: {
      color: '#FFFFFF',
    },
    pointsContainer: {
      paddingHorizontal: 16,
    },
    pointCard: {
      backgroundColor: theme.panel,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pointHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    pointIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: theme.panelSoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    pointIcon: {
      fontSize: 16,
    },
    pointTitleContainer: {
      flex: 1,
      gap: 4,
    },
    pointTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    pointTag: {
      alignSelf: 'flex-start',
      backgroundColor: theme.panelSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    pointTagText: {
      fontSize: 11,
      color: theme.textMuted,
      fontWeight: '700',
    },
    pointContent: {
      fontSize: 13,
      color: theme.textMuted,
      lineHeight: 20,
      fontWeight: '500',
    },
  });
