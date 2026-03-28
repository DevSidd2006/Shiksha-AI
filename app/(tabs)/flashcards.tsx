import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CLASS_9_SCIENCE, getCardsByChapter } from '@/features/content';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/shared';
import { DARK_THEME, LIGHT_THEME, AppTheme, Spacing, BorderRadius } from '@/shared';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface FlashcardState {
  currentCardIndex: number;
  isFlipped: boolean;
  selectedChapter: number | null;
  masteredCards: Set<string>;
  reviewCards: Set<string>;
}

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
  const theme: AppTheme = isDark ? DARK_THEME : LIGHT_THEME;
  const styles = useMemo(() => createStyles(theme, isDark), [theme]);

  const [flipAnim] = useState(new Animated.Value(0));
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 45, useNativeDriver: true }),
    ]).start();
  }, [state.selectedChapter]);

  const currentCards = state.selectedChapter ? getCardsByChapter(state.selectedChapter) : [];
  const currentCard  = currentCards[state.currentCardIndex];

  const filteredChapters = useMemo(() => {
    if (!query.trim()) return CLASS_9_SCIENCE;
    return CLASS_9_SCIENCE.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  const totalCards = useMemo(() => CLASS_9_SCIENCE.reduce((s: number, c: any) => s + c.cards.length, 0), []);

  const handleFlip = () => {
    Animated.spring(flipAnim, {
      toValue: state.isFlipped ? 0 : 180,
      friction: 8, tension: 10, useNativeDriver: true,
    }).start();
    setState(p => ({ ...p, isFlipped: !p.isFlipped }));
  };

  const advanceCard = useCallback((mastered: boolean) => {
    if (!currentCard) return;
    setState(p => {
      const next = { ...p };
      if (mastered) next.masteredCards = new Set(p.masteredCards).add(currentCard.id);
      else next.reviewCards = new Set(p.reviewCards).add(currentCard.id);
      if (p.currentCardIndex < currentCards.length - 1) {
        next.currentCardIndex = p.currentCardIndex + 1;
        next.isFlipped = false;
        flipAnim.setValue(0);
      } else {
        next.selectedChapter = null;
        next.currentCardIndex = 0;
        next.isFlipped = false;
        flipAnim.setValue(0);
      }
      return next;
    });
  }, [currentCard, currentCards.length]);

  const frontRot = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRot  = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });
  const frontOp  = flipAnim.interpolate({ inputRange: [89, 90], outputRange: [1, 0] });
  const backOp   = flipAnim.interpolate({ inputRange: [89, 90], outputRange: [0, 1] });

  const masteredCount = state.masteredCards.size;
  const reviewNeeded  = state.reviewCards.size;

  // ── Chapter selection view ──────────────────────────────────────────────────
  if (!state.selectedChapter) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <LinearGradient colors={theme.headerGradient as any} style={styles.header}>
          <View style={styles.hRow}>
            <View>
              <Text style={styles.hKicker}>STUDY LIBRARY</Text>
              <Text style={styles.hTitle}>Flashcards</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Hero stats */}
          <View style={styles.libStats}>
            {[
              { val: CLASS_9_SCIENCE.length, lbl: 'Chapters', icon: 'book-outline' },
              { val: totalCards,             lbl: 'Cards',    icon: 'layers-outline' },
              { val: masteredCount,          lbl: 'Mastered', icon: 'checkmark-circle-outline' },
            ].map(s => (
              <LinearGradient
                key={s.lbl}
                colors={theme.cardGradient as any}
                style={styles.libStatChip}
              >
                <Ionicons name={s.icon as any} size={16} color={theme.accent} />
                <Text style={styles.libStatVal}>{s.val}</Text>
                <Text style={styles.libStatLbl}>{s.lbl}</Text>
              </LinearGradient>
            ))}
          </View>
        </LinearGradient>

        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search chapters…"
              placeholderTextColor={theme.textMuted}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Chapter list */}
        <FlatList
          data={filteredChapters}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const cardCount = item.cards.length;
            const COLORS = ['#818CF8','#34D399','#F59E0B','#F472B6','#60A5FA','#A78BFA'];
            const col = COLORS[index % COLORS.length];
            return (
              <TouchableOpacity
                style={styles.chapterCard}
                onPress={() => {
                  fadeAnim.setValue(0);
                  slideAnim.setValue(20);
                  setState(p => ({ ...p, selectedChapter: item.id, currentCardIndex: 0, isFlipped: false }));
                  flipAnim.setValue(0);
                }}
                activeOpacity={0.82}
              >
                <View style={[styles.chapterIcon, { backgroundColor: `${col}22` }]}>
                  <MaterialCommunityIcons name="book-open-variant" size={20} color={col} />
                </View>
                <View style={styles.chapterInfo}>
                  <Text style={styles.chapterTitle}>{item.title}</Text>
                  <Text style={styles.chapterSub}>{cardCount} flashcards</Text>
                </View>
                <View style={[styles.chapterArrow, { backgroundColor: `${col}18` }]}>
                  <Ionicons name="chevron-forward" size={16} color={col} />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No chapters found</Text>
              <Text style={styles.emptySubtitle}>Try a different keyword.</Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  // ── Active flashcard study view ─────────────────────────────────────────────
  const progress = currentCards.length ? (state.currentCardIndex / currentCards.length) * 100 : 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: isDark ? '#06070B' : '#F4F6FB' }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Study header */}
      <View style={styles.studyHeader}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            fadeAnim.setValue(0); slideAnim.setValue(20);
            setState(p => ({ ...p, selectedChapter: null, currentCardIndex: 0, isFlipped: false }));
            flipAnim.setValue(0);
          }}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.studyProgress}>
          <View style={[styles.studyTrack, { backgroundColor: theme.panelSoft }]}>
            <Animated.View style={[styles.studyFill, { width: `${progress}%`, backgroundColor: theme.accent }]} />
          </View>
          <Text style={styles.studyCounter}>{state.currentCardIndex + 1} / {currentCards.length}</Text>
        </View>

        <View style={styles.studyBadges}>
          <View style={[styles.studyBadge, { backgroundColor: theme.tagSuccess }]}>
            <Ionicons name="checkmark" size={12} color={theme.tagSuccessText} />
            <Text style={[styles.studyBadgeText, { color: theme.tagSuccessText }]}>{masteredCount}</Text>
          </View>
          <View style={[styles.studyBadge, { backgroundColor: theme.tagWarning }]}>
            <Ionicons name="refresh" size={12} color={theme.tagWarningText} />
            <Text style={[styles.studyBadgeText, { color: theme.tagWarningText }]}>{reviewNeeded}</Text>
          </View>
        </View>
      </View>

      {/* Flip card */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.cardStage}>
          <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.cardHitArea}>
            {/* Front */}
            <Animated.View
              style={[
                styles.card, styles.cardFront,
                { transform: [{ perspective: 1200 }, { rotateY: frontRot }], opacity: frontOp },
                isDark ? styles.cardDark : styles.cardLight,
              ]}
            >
              <LinearGradient
                colors={isDark ? ['#1C2040','#131729'] : ['#6366F1','#818CF8']}
                style={styles.cardGradientHeader}
              >
                <Text style={styles.cardTypeLabel}>✨ QUESTION</Text>
              </LinearGradient>
              <View style={styles.cardBody}>
                <Text style={styles.cardText}>{currentCard?.question}</Text>
              </View>
              <View style={styles.flipHint}>
                <Ionicons name="sync-outline" size={15} color={theme.textMuted} />
                <Text style={styles.flipHintText}>Tap to flip</Text>
              </View>
            </Animated.View>

            {/* Back */}
            <Animated.View
              style={[
                styles.card, styles.cardBack,
                { transform: [{ perspective: 1200 }, { rotateY: backRot }], opacity: backOp },
                isDark ? styles.cardDark : styles.cardLight,
              ]}
            >
              <LinearGradient
                colors={isDark ? ['#123527','#0F1A12'] : ['#10B981','#34D399']}
                style={styles.cardGradientHeader}
              >
                <Text style={styles.cardTypeLabel}>💡 ANSWER</Text>
              </LinearGradient>
              <View style={styles.cardBody}>
                <Text style={[styles.cardText, { fontSize: 17 }]}>{currentCard?.answer}</Text>
              </View>
              <View style={styles.flipHint}>
                <Ionicons name="sync-outline" size={15} color={theme.textMuted} />
                <Text style={styles.flipHintText}>Tap to flip back</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: theme.tagError }]} onPress={() => advanceCard(false)}>
            <Ionicons name="refresh" size={22} color={isDark ? '#F87171' : '#991B1B'} />
            <Text style={[styles.ctrlLabel, { color: isDark ? '#F87171' : '#991B1B' }]}>Review</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: theme.buttonBg }]}
            onPress={() => advanceCard(false)}
          >
            <Text style={[styles.nextBtnText, { color: theme.buttonText }]}>
              {state.currentCardIndex === currentCards.length - 1 ? 'Finish' : 'Next Card'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={theme.buttonText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: theme.tagSuccess }]} onPress={() => advanceCard(true)}>
            <Ionicons name="checkmark" size={22} color={isDark ? '#34D399' : '#065F46'} />
            <Text style={[styles.ctrlLabel, { color: isDark ? '#34D399' : '#065F46' }]}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.surface },

    // Header
    header: { paddingHorizontal: Spacing.lg, paddingBottom: 16 },
    hRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginBottom: 14 },
    hKicker: { color: theme.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
    hTitle:  { color: theme.text, fontSize: 26, fontWeight: '800' },
    iconBtn: {
      width: 36, height: 36, borderRadius: 12,
      backgroundColor: theme.panel,
      borderWidth: 1, borderColor: theme.border,
      justifyContent: 'center', alignItems: 'center',
    },

    // Library stats
    libStats: { flexDirection: 'row', gap: 10 },
    libStatChip: {
      flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4,
      borderWidth: 1, borderColor: theme.border,
    },
    libStatVal: { color: theme.text, fontSize: 17, fontWeight: '800' },
    libStatLbl: { color: theme.textMuted, fontSize: 11, fontWeight: '600' },

    // Search
    searchWrap: { paddingHorizontal: Spacing.lg, paddingVertical: 12 },
    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border,
      borderRadius: 14, paddingHorizontal: 14, height: 46,
    },
    searchInput: { flex: 1, color: theme.text, fontSize: 14, fontWeight: '500' },

    // Chapter cards
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 28 },
    chapterCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.panel,
      borderWidth: 1, borderColor: theme.border,
      borderRadius: 16, padding: 14, marginBottom: 10,
    },
    chapterIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    chapterInfo: { flex: 1 },
    chapterTitle: { color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 3 },
    chapterSub:   { color: theme.textMuted, fontSize: 12, fontWeight: '600' },
    chapterArrow: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
    emptySubtitle: { color: theme.textMuted, fontSize: 13 },

    // Study view
    studyHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.lg, paddingVertical: 12, gap: 10,
    },
    studyProgress: { flex: 1, gap: 4 },
    studyTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
    studyFill:  { height: '100%', borderRadius: 999 },
    studyCounter: { color: theme.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
    studyBadges: { flexDirection: 'row', gap: 6 },
    studyBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    },
    studyBadgeText: { fontSize: 11, fontWeight: '800' },

    // Cards
    cardStage: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    cardHitArea: { width: width - 48, height: 360 },
    card: {
      position: 'absolute', width: '100%', height: '100%',
      borderRadius: 24, overflow: 'hidden',
      backfaceVisibility: 'hidden',
      borderWidth: 1,
    },
    cardDark:  { borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#818CF8', shadowOffset:{width:0,height:8}, shadowOpacity:0.25, shadowRadius:20, elevation:8 },
    cardLight: { borderColor: 'rgba(0,0,0,0.07)', shadowColor: '#6366F1', shadowOffset:{width:0,height:8}, shadowOpacity:0.15, shadowRadius:20, elevation:8 },
    cardFront: { zIndex: 2 },
    cardBack:  { zIndex: 1 },
    cardGradientHeader: { paddingHorizontal: 20, paddingVertical: 12 },
    cardTypeLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
    cardBody: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      paddingHorizontal: 24, backgroundColor: isDark ? '#0F1320' : '#FFFFFF',
    },
    cardText: { color: theme.text, fontSize: 20, fontWeight: '700', textAlign: 'center', lineHeight: 30 },
    flipHint: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      justifyContent: 'center', paddingVertical: 12,
      backgroundColor: isDark ? '#0F1320' : '#FFFFFF',
    },
    flipHintText: { color: theme.textMuted, fontSize: 12, fontWeight: '600' },

    // Controls
    controls: {
      flexDirection: 'row', paddingHorizontal: Spacing.lg,
      paddingBottom: 20, alignItems: 'center', gap: 10,
    },
    ctrlBtn: {
      width: 72, height: 64, borderRadius: 16,
      justifyContent: 'center', alignItems: 'center', gap: 4,
    },
    ctrlLabel: { fontSize: 10, fontWeight: '800' },
    nextBtn: {
      flex: 1, height: 56, borderRadius: 16,
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    },
    nextBtnText: { fontSize: 16, fontWeight: '800' },
  });
}
