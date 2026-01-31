import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '@/styles/designSystem';

// Import data with fallback
let CLASS_9_SCIENCE_NOTES: any[] = [];
let getChapterNotes: any = () => undefined;
let getAllCategories: any = () => [];

try {
  const notesData = require('@/data/class9ScienceNotes');
  CLASS_9_SCIENCE_NOTES = notesData.CLASS_9_SCIENCE_NOTES || [];
  getChapterNotes = notesData.getChapterNotes || (() => undefined);
  getAllCategories = notesData.getAllCategories || (() => []);
} catch (error) {
  console.error('Failed to load notes data:', error);
}

const { width } = Dimensions.get('window');

interface Chapter {
  id: number;
  title: string;
}

export default function NotesScreen() {
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
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#6366F1', '#4F46E5'] as any} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <Text style={styles.headerSubtitle}>Study Smart</Text>
            <Text style={styles.headerTitle}>Class 9 Science Notes</Text>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Select a Chapter</Text>
          {chapters.map((chapter) => (
            <TouchableOpacity
              key={chapter.id}
              style={styles.chapterCard}
              onPress={() => setSelectedChapter(chapter.id)}
            >
              <LinearGradient
                colors={['#EEF2FF', '#E0E7FF'] as any}
                style={styles.chapterIconBox}
              >
                <FontAwesome5 name="book-open" size={20} color={Colors.primary} />
              </LinearGradient>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                <Text style={styles.chapterPoints}>
                  {CLASS_9_SCIENCE_NOTES[chapter.id - 1]?.points.length || 0} Key Concepts
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.gray400} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  const chapterData = getChapterNotes(selectedChapter);

  if (!chapterData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Chapter not found</Text>
      </SafeAreaView>
    );
  }

  const filteredPoints = selectedCategory
    ? chapterData.points.filter(p => p.category === selectedCategory)
    : chapterData.points;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#6366F1', '#4F46E5'] as any} style={styles.headerCompact}>
        <SafeAreaView edges={['top']} style={styles.headerFlex}>
          <TouchableOpacity onPress={() => setSelectedChapter(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerSubtitleCompact}>Chapter {selectedChapter}</Text>
            <Text style={styles.headerTitleCompact} numberOfLines={1}>{chapterData.chapterTitle}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <LinearGradient
          colors={['#F1F5F9', '#F8FAFC'] as any}
          style={styles.introCard}
        >
          <View style={styles.introHeader}>
            <FontAwesome5 name="info-circle" size={16} color={Colors.primary} />
            <Text style={styles.introTitle}>QUICK OVERVIEW</Text>
          </View>
          <Text style={styles.introText}>{chapterData.introduction}</Text>
        </LinearGradient>

        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <Text style={styles.sectionTitleSmall}>CATEGORIES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.categoryButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Important Points */}
        <View style={styles.pointsContainer}>
          <Text style={styles.sectionTitleSmall}>
            {selectedCategory ? `${selectedCategory} (${filteredPoints.length})` : `ALL POINTS (${chapterData.points.length})`}
          </Text>

          {filteredPoints.map((point, index) => (
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

        <View style={{ height: 40 }} />
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerCompact: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: 10,
  },
  headerTitleCompact: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitleCompact: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.gray900,
    marginBottom: 20,
  },
  sectionTitleSmall: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.gray400,
    marginBottom: 15,
    letterSpacing: 1,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Colors.cardShadow as any,
  },
  chapterIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray900,
    marginBottom: 4,
  },
  chapterPoints: {
    fontSize: 13,
    color: Colors.gray500,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 40,
  },
  introCard: {
    borderRadius: 20,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  introText: {
    fontSize: 14,
    color: Colors.gray600,
    lineHeight: 22,
    fontWeight: '500',
  },
  categoryContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  categoryScroll: {
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  categoryContent: {
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray500,
  },
  categoryButtonTextActive: {
    color: Colors.white,
  },
  pointsContainer: {
    paddingHorizontal: Spacing.xl,
  },
  pointCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Colors.cardShadow as any,
  },
  pointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pointIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pointIcon: {
    fontSize: 20,
  },
  pointTitleContainer: {
    flex: 1,
    gap: 3,
  },
  pointTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.gray900,
  },
  pointTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pointTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  pointContent: {
    fontSize: 15,
    color: Colors.gray600,
    lineHeight: 24,
    fontWeight: '500',
  },
});
