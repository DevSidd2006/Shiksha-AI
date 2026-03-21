import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CLASS_9_SCIENCE, getCardsByChapter } from '@/features/content';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/shared';

const { width } = Dimensions.get('window');

interface FlashcardState {
  currentCardIndex: number;
  isFlipped: boolean;
  selectedChapter: number | null;
  masteredCards: Set<string>;
  reviewCards: Set<string>;
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
  buttonBg: string;
  buttonText: string;
  searchPlaceholder: string;
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
  buttonBg: '#FFFFFF',
  buttonText: '#0A0C13',
  searchPlaceholder: '#8A93A8',
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
  buttonBg: '#10182D',
  buttonText: '#FFFFFF',
  searchPlaceholder: '#6A7488',
};

export default function FlashcardsScreen() {
  const [state, setState] = useState<FlashcardState>({
    currentCardIndex: 0,
    isFlipped: false,
    selectedChapter: null,
    masteredCards: new Set(),
    reviewCards: new Set(),
  });
  const [query, setQuery] = useState('');
  const { mode, toggleTheme } = useAppTheme();

  const isDark = mode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const barStyle = isDark ? 'light-content' : 'dark-content';

  const [flipAnim] = useState(new Animated.Value(0));

  const currentCards = state.selectedChapter ? getCardsByChapter(state.selectedChapter) : [];
  const currentCard = currentCards[state.currentCardIndex];

  const filteredChapters = useMemo(() => {
    if (!query.trim()) return CLASS_9_SCIENCE;
    const normalized = query.toLowerCase();
    return CLASS_9_SCIENCE.filter((chapter) => chapter.title.toLowerCase().includes(normalized));
  }, [query]);

  const totalItems = useMemo(
    () => CLASS_9_SCIENCE.reduce((sum, chapter) => sum + chapter.cards.length, 0),
    []
  );

  const handleFlip = () => {
    Animated.spring(flipAnim, {
      toValue: state.isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    setState((prev) => ({
      ...prev,
      isFlipped: !prev.isFlipped,
    }));
  };

  const handleNext = () => {
    if (state.currentCardIndex < currentCards.length - 1) {
      setState((prev) => ({
        ...prev,
        currentCardIndex: prev.currentCardIndex + 1,
        isFlipped: false,
      }));
      flipAnim.setValue(0);
    } else {
      Alert.alert('Chapter Complete!', 'You have reviewed all cards in this chapter.', [
        {
          text: 'Back to Library',
          onPress: () =>
            setState((prev) => ({
              ...prev,
              selectedChapter: null,
              currentCardIndex: 0,
              isFlipped: false,
            })),
        },
      ]);
    }
  };

  const handleMastered = () => {
    if (!currentCard) return;
    setState((prev) => {
      const newMastered = new Set(prev.masteredCards);
      newMastered.add(currentCard.id);
      return { ...prev, masteredCards: newMastered };
    });
    handleNext();
  };

  const handleReview = () => {
    if (!currentCard) return;
    setState((prev) => {
      const newReview = new Set(prev.reviewCards);
      newReview.add(currentCard.id);
      return { ...prev, reviewCards: newReview };
    });
    handleNext();
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  if (!state.selectedChapter) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle={barStyle} />

        <LinearGradient colors={theme.headerGradient as any} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandWrap}>
              <View style={styles.brandIcon}>
                <Ionicons name="library-outline" size={15} color={theme.accent} />
              </View>
              <Text style={styles.brandText}>Library</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="bookmark-outline" size={16} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          <LinearGradient colors={theme.cardGradient as any} style={styles.heroCard}>
            <Text style={styles.heroTitle}>Study Collections</Text>
            <Text style={styles.heroSubtitle}>Explore chapters, revise concepts, and practice with flashcards.</Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatChip}>
                <Text style={styles.heroStatValue}>{CLASS_9_SCIENCE.length}</Text>
                <Text style={styles.heroStatLabel}>Chapters</Text>
              </View>
              <View style={styles.heroStatChip}>
                <Text style={styles.heroStatValue}>{totalItems}</Text>
                <Text style={styles.heroStatLabel}>Cards</Text>
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>

        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={theme.textMuted} />
            <TextInput
              placeholder="Search chapter resources..."
              placeholderTextColor={theme.searchPlaceholder}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
          </View>
        </View>

        <FlatList
          data={filteredChapters}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<Text style={styles.sectionTitle}>All Collections</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chapterCard}
              onPress={() =>
                setState((prev) => ({
                  ...prev,
                  selectedChapter: item.id,
                  currentCardIndex: 0,
                  isFlipped: false,
                }))
              }
            >
              <View style={styles.chapterIcon}>
                <FontAwesome5 name="book-open" size={14} color={theme.accent} />
              </View>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterTitle}>{item.title}</Text>
                <Text style={styles.chapterSubtitle}>{item.cards.length} flashcards</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No resources found</Text>
              <Text style={styles.emptySubtitle}>Try another keyword.</Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.studyContainer}>
      <StatusBar barStyle={barStyle} />

      <View style={styles.quizHeader}>
        <TouchableOpacity
          onPress={() =>
            setState((prev) => ({
              ...prev,
              selectedChapter: null,
              currentCardIndex: 0,
              isFlipped: false,
            }))
          }
          style={styles.headerAction}
        >
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.progressTracker}>
          <Text style={styles.progressText}>
            Card {state.currentCardIndex + 1}/{currentCards.length}
          </Text>
        </View>

        <TouchableOpacity onPress={toggleTheme} style={styles.headerAction}>
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardWrapper}>
        <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.cardContainer}>
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity },
            ]}
          >
            <Text style={styles.cardTag}>Question</Text>
            <Text style={styles.cardText}>{currentCard?.question}</Text>
            <View style={styles.flipHint}>
              <Ionicons name="refresh" size={16} color={theme.textMuted} />
              <Text style={styles.flipHintText}>Tap to see answer</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              { transform: [{ rotateY: backInterpolate }], opacity: backOpacity },
            ]}
          >
            <Text style={styles.cardTag}>Answer</Text>
            <Text style={styles.cardTextBack}>{currentCard?.answer}</Text>
            <View style={styles.flipHint}>
              <Ionicons name="refresh" size={16} color={theme.textMuted} />
              <Text style={styles.flipHintText}>Tap to see question</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleReview}>
          <Ionicons name="refresh" size={24} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainButton} onPress={handleNext}>
          <Text style={styles.mainButtonText}>
            {state.currentCardIndex === currentCards.length - 1 ? 'Finish' : 'Next Card'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={theme.buttonText} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleMastered}>
          <Ionicons name="checkmark" size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>
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
    headerActions: {
      flexDirection: 'row',
      gap: 8,
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
    heroStatsRow: {
      marginTop: 6,
      flexDirection: 'row',
      gap: 8,
    },
    heroStatChip: {
      backgroundColor: theme.panelSoft,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    heroStatValue: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
    },
    heroStatLabel: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    searchWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    searchBox: {
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      fontWeight: '500',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 28,
    },
    sectionTitle: {
      marginTop: 6,
      marginBottom: 10,
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
    },
    chapterCard: {
      backgroundColor: theme.panel,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      marginBottom: 10,
    },
    chapterIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.chipBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    chapterInfo: {
      flex: 1,
    },
    chapterTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
    },
    chapterSubtitle: {
      marginTop: 2,
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
    emptyState: {
      paddingVertical: 36,
      alignItems: 'center',
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
    },
    emptySubtitle: {
      marginTop: 4,
      color: theme.textMuted,
      fontSize: 13,
    },
    studyContainer: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    quizHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerAction: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.panelSoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    progressTracker: {
      backgroundColor: theme.panelSoft,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
    },
    progressText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    cardWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    cardContainer: {
      width: width - 56,
      height: 420,
    },
    card: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.panel,
      borderRadius: 30,
      padding: 30,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      backfaceVisibility: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardFront: {
      zIndex: 2,
    },
    cardBack: {
      zIndex: 1,
    },
    cardTag: {
      position: 'absolute',
      top: 24,
      left: 24,
      fontSize: 12,
      fontWeight: '800',
      color: theme.accent,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    cardText: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
      lineHeight: 34,
    },
    cardTextBack: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
      lineHeight: 28,
    },
    flipHint: {
      position: 'absolute',
      bottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    flipHintText: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '600',
    },
    controls: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingBottom: 20,
      alignItems: 'center',
      gap: 12,
    },
    controlButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.panelSoft,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mainButton: {
      flex: 1,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.buttonBg,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    mainButtonText: {
      color: theme.buttonText,
      fontSize: 17,
      fontWeight: '800',
    },
  });
