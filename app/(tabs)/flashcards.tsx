import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CLASS_9_SCIENCE, getCardsByChapter, Flashcard, Chapter } from '@/data/class9Science';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '@/styles/designSystem';

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

  const [flipAnim] = useState(new Animated.Value(0));

  const currentCards = state.selectedChapter
    ? getCardsByChapter(state.selectedChapter)
    : [];

  const currentCard = currentCards[state.currentCardIndex];

  const handleFlip = () => {
    Animated.spring(flipAnim, {
      toValue: state.isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    setState(prev => ({
      ...prev,
      isFlipped: !prev.isFlipped,
    }));
  };

  const handleNext = () => {
    if (state.currentCardIndex < currentCards.length - 1) {
      setState(prev => ({
        ...prev,
        currentCardIndex: prev.currentCardIndex + 1,
        isFlipped: false,
      }));
      flipAnim.setValue(0);
    } else {
      Alert.alert('Chapter Complete!', 'You have reviewed all cards in this chapter.', [
        { text: 'Back to Chapters', onPress: () => setState(prev => ({ ...prev, selectedChapter: null })) }
      ]);
    }
  };

  const handlePrevious = () => {
    if (state.currentCardIndex > 0) {
      setState(prev => ({
        ...prev,
        currentCardIndex: prev.currentCardIndex - 1,
        isFlipped: false,
      }));
      flipAnim.setValue(0);
    }
  };

  const handleMastered = () => {
    setState(prev => {
      const newMastered = new Set(prev.masteredCards);
      newMastered.add(currentCard.id);
      return { ...prev, masteredCards: newMastered };
    });
    handleNext();
  };

  const handleReview = () => {
    setState(prev => {
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
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#6366F1', '#4F46E5'] as any}
          style={styles.mainHeader}
        >
          <SafeAreaView edges={['top']}>
            <Text style={styles.headerSubtitle}>Master Concepts</Text>
            <Text style={styles.headerTitle}>Flashcards</Text>
          </SafeAreaView>
        </LinearGradient>

        <FlatList
          data={CLASS_9_SCIENCE}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chapterCard}
              onPress={() => setState(prev => ({ ...prev, selectedChapter: item.id, currentCardIndex: 0 }))}
            >
              <LinearGradient
                colors={['#EEF2FF', '#E0E7FF'] as any}
                style={styles.chapterGradient}
              >
                <FontAwesome5 name="layer-group" size={20} color={Colors.primary} />
              </LinearGradient>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterTitle}>{item.title}</Text>
                <Text style={styles.chapterSubtitle}>{item.cards.length} Flashcards</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.quizHeader}>
        <TouchableOpacity onPress={() => setState(prev => ({ ...prev, selectedChapter: null }))}>
          <Ionicons name="close" size={28} color={Colors.gray900} />
        </TouchableOpacity>
        <View style={styles.progressTracker}>
          <Text style={styles.progressText}>Card {state.currentCardIndex + 1}/{currentCards.length}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.cardWrapper}>
        <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.cardContainer}>
          <Animated.View style={[styles.card, styles.cardFront, { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity }]}>
            <Text style={styles.cardTag}>Question</Text>
            <Text style={styles.cardText}>{currentCard?.question || currentCard?.front}</Text>
            <View style={styles.flipHint}>
              <Ionicons name="refresh" size={16} color={Colors.gray400} />
              <Text style={styles.flipHintText}>Tap to see answer</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backInterpolate }], opacity: backOpacity }]}>
            <Text style={styles.cardTag}>Answer</Text>
            <Text style={styles.cardTextBack}>{currentCard?.answer || currentCard?.back}</Text>
            <View style={styles.flipHint}>
              <Ionicons name="refresh" size={16} color={Colors.gray400} />
              <Text style={styles.flipHintText}>Tap to see question</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleReview} >
          <Ionicons name="refresh" size={24} color={Colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.mainButton, { backgroundColor: Colors.secondary }]} onPress={handleNext}>
          <Text style={styles.mainButtonText}>
            {state.currentCardIndex === currentCards.length - 1 ? 'Finish' : 'Next Card'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleMastered} >
          <Ionicons name="checkmark" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainHeader: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  listContent: {
    padding: Spacing.lg,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 20,
    marginBottom: Spacing.md,
    ...Colors.cardShadow as any,
  },
  chapterGradient: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.gray900,
  },
  chapterSubtitle: {
    fontSize: 13,
    color: Colors.gray500,
    marginTop: 2,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  progressTracker: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gray700,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  cardContainer: {
    width: width - 60,
    height: 400,
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 30,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    backfaceVisibility: 'hidden',
    ...Colors.cardShadow as any,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardFront: {
    zIndex: 2,
  },
  cardBack: {
    zIndex: 1,
  },
  cardTag: {
    position: 'absolute',
    top: 25,
    left: 25,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray900,
    textAlign: 'center',
    lineHeight: 34,
  },
  cardTextBack: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray700,
    textAlign: 'center',
    lineHeight: 28,
  },
  flipHint: {
    position: 'absolute',
    bottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flipHintText: {
    fontSize: 12,
    color: Colors.gray400,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 15,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Colors.cardShadow as any,
  },
  mainButton: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    ...Colors.cardShadow as any,
  },
  mainButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
