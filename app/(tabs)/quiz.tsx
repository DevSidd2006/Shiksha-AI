import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { CLASS_9_SCIENCE, Chapter } from '@/features/content';
import { CLASS_9_SCIENCE_QUIZ, QuizQuestion } from '@/features/content';
import { useAppTheme } from '@/shared';

type QuizState = 'selecting' | 'active' | 'finished';

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
};

export default function QuizScreen() {
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [state, setState] = useState<QuizState>('selecting');
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const startQuiz = (chapter: Chapter) => {
    const chapterQuestions = CLASS_9_SCIENCE_QUIZ.filter((q) => q.chapter === chapter.id);
    if (chapterQuestions.length === 0) {
      Alert.alert('Coming Soon', 'Quiz questions for this chapter are being added!');
      return;
    }
    setCurrentChapter(chapter);
    setQuestions(chapterQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setState('active');
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const checkAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    if (selectedOption === questions[currentQuestionIndex].correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setState('finished');
    }
  };

  const resetQuiz = () => {
    setState('selecting');
    setCurrentChapter(null);
  };

  if (state === 'selecting') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <LinearGradient colors={theme.headerGradient as any} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandWrap}>
              <View style={styles.brandIcon}>
                <Ionicons name="help-circle-outline" size={15} color={theme.accent} />
              </View>
              <Text style={styles.brandText}>Quiz</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={theme.text} />
            </TouchableOpacity>
          </View>

          <LinearGradient colors={theme.cardGradient as any} style={styles.heroCard}>
            <Text style={styles.heroTitle}>Practice Quiz</Text>
            <Text style={styles.heroSubtitle}>Choose a chapter and test your understanding.</Text>
          </LinearGradient>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Select a Chapter</Text>
          {CLASS_9_SCIENCE.map((chapter) => (
            <TouchableOpacity key={chapter.id} style={styles.chapterCard} onPress={() => startQuiz(chapter)}>
              <View style={styles.chapterIconContainer}>
                <FontAwesome5 name="microscope" size={14} color={theme.accent} />
              </View>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterName}>{chapter.title}</Text>
                <Text style={styles.questionCount}>
                  {CLASS_9_SCIENCE_QUIZ.filter((q) => q.chapter === chapter.id).length} Questions
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state === 'active') {
    const question = questions[currentQuestionIndex];
    const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={resetQuiz} style={styles.headerAction}>
            <Ionicons name="close" size={22} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.progressWrapper}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{currentQuestionIndex + 1} of {questions.length}</Text>
          </View>

          <TouchableOpacity onPress={toggleTheme} style={styles.headerAction}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.quizContent} showsVerticalScrollIndicator={false}>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{question.question}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const isCorrect = isAnswered && index === question.correctAnswer;
              const isWrongSelected = isAnswered && index === selectedOption && index !== question.correctAnswer;
              const isSelected = !isAnswered && index === selectedOption;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionCard,
                    isSelected && styles.selectedOption,
                    isCorrect && styles.correctOption,
                    isWrongSelected && styles.wrongOption,
                  ]}
                  onPress={() => handleOptionSelect(index)}
                  disabled={isAnswered}
                >
                  <View style={[styles.optionIndex, isSelected && styles.optionIndexSelected]}>
                    <Text style={[styles.optionIndexText, isSelected && styles.optionIndexTextSelected]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                      isCorrect && styles.correctOptionText,
                      isWrongSelected && styles.wrongOptionText,
                    ]}
                  >
                    {option}
                  </Text>
                  {isCorrect && <Ionicons name="checkmark-circle" size={20} color="#22C55E" />}
                  {isWrongSelected && <Ionicons name="close-circle" size={20} color="#EF4444" />}
                </TouchableOpacity>
              );
            })}
          </View>

          {isAnswered && (
            <View style={styles.explanationCard}>
              <View style={styles.explanationHeader}>
                <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                <Text style={styles.explanationTitle}>Explanation</Text>
              </View>
              <Text style={styles.explanationText}>{question.explanation}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {!isAnswered ? (
            <TouchableOpacity
              style={[styles.actionBtn, selectedOption === null && styles.disabledBtn]}
              onPress={checkAnswer}
              disabled={selectedOption === null}
            >
              <Text style={styles.actionBtnText}>Check Answer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionBtn} onPress={nextQuestion}>
              <Text style={styles.actionBtnText}>
                {currentQuestionIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const accuracy = questions.length ? Math.round((score / questions.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient colors={theme.headerGradient as any} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandWrap}>
            <View style={styles.brandIcon}>
              <Ionicons name="trophy-outline" size={15} color={theme.accent} />
            </View>
            <Text style={styles.brandText}>Quiz Results</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={theme.text} />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={theme.cardGradient as any} style={styles.heroCard}>
          <Text style={styles.heroTitle}>{currentChapter?.title}</Text>
          <Text style={styles.heroSubtitle}>You scored {score} out of {questions.length}</Text>
        </LinearGradient>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.finishedScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.resultCard}>
          <View style={styles.resultStat}>
            <Text style={[styles.resultValue, { color: '#22C55E' }]}>{score}</Text>
            <Text style={styles.resultLabel}>Correct</Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultStat}>
            <Text style={[styles.resultValue, { color: '#EF4444' }]}>{questions.length - score}</Text>
            <Text style={styles.resultLabel}>Incorrect</Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultStat}>
            <Text style={[styles.resultValue, { color: theme.accent }]}>{accuracy}%</Text>
            <Text style={styles.resultLabel}>Accuracy</Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={resetQuiz}>
            <Text style={styles.secondaryBtnText}>Back to Chapters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              if (currentChapter) startQuiz(currentChapter);
            }}
          >
            <Text style={styles.primaryBtnText}>Retry Quiz</Text>
          </TouchableOpacity>
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
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 28,
    },
    sectionTitle: {
      marginBottom: 10,
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
    },
    chapterCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
      borderRadius: 14,
      marginBottom: 10,
    },
    chapterIconContainer: {
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
    chapterName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    questionCount: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    quizHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.panel,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerAction: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.panelSoft,
      borderWidth: 1,
      borderColor: theme.border,
    },
    progressWrapper: {
      flex: 1,
      paddingHorizontal: 12,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: theme.panelSoft,
      borderRadius: 999,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.accent,
    },
    progressText: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 4,
      textAlign: 'center',
      fontWeight: '600',
    },
    quizContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 20,
      gap: 10,
    },
    questionCard: {
      backgroundColor: theme.panel,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
    },
    questionText: {
      fontSize: 17,
      lineHeight: 25,
      color: theme.text,
      fontWeight: '700',
    },
    optionsContainer: {
      marginTop: 10,
      gap: 10,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
      gap: 10,
    },
    selectedOption: {
      borderColor: theme.accent,
      backgroundColor: theme.panelSoft,
    },
    correctOption: {
      borderColor: '#22C55E',
      backgroundColor: 'rgba(34,197,94,0.08)',
    },
    wrongOption: {
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239,68,68,0.08)',
    },
    optionIndex: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.panelSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionIndexSelected: {
      backgroundColor: theme.accent,
    },
    optionIndexText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
    },
    optionIndexTextSelected: {
      color: '#FFFFFF',
    },
    optionText: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
      lineHeight: 21,
    },
    selectedOptionText: {
      color: theme.text,
      fontWeight: '700',
    },
    correctOptionText: {
      color: '#14532D',
      fontWeight: '700',
    },
    wrongOptionText: {
      color: '#991B1B',
      fontWeight: '700',
    },
    explanationCard: {
      backgroundColor: theme.panel,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginTop: 8,
    },
    explanationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    explanationTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '700',
    },
    explanationText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: '500',
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.panel,
    },
    actionBtn: {
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.buttonBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    disabledBtn: {
      opacity: 0.45,
    },
    actionBtnText: {
      color: theme.buttonText,
      fontSize: 14,
      fontWeight: '800',
    },
    finishedScroll: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 30,
    },
    resultCard: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    resultStat: {
      flex: 1,
      alignItems: 'center',
    },
    resultValue: {
      fontSize: 24,
      fontWeight: '800',
    },
    resultLabel: {
      marginTop: 3,
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
    },
    resultDivider: {
      width: 1,
      height: 36,
      backgroundColor: theme.border,
    },
    actionGrid: {
      marginTop: 14,
      gap: 10,
    },
    secondaryBtn: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryBtnText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
    },
    primaryBtn: {
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.buttonBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryBtnText: {
      color: theme.buttonText,
      fontSize: 14,
      fontWeight: '800',
    },
  });
