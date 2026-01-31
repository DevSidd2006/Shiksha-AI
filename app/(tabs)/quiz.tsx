import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { CLASS_9_SCIENCE, Chapter } from '@/data/class9Science';
import { CLASS_9_SCIENCE_QUIZ, QuizQuestion } from '@/data/class9ScienceQuiz';
import { Colors, Fonts, Shadows, Spacing, BorderRadius } from '@/styles/designSystem';

const { width } = Dimensions.get('window');

type QuizState = 'selecting' | 'active' | 'finished';

const INDIGO_GRADIENT = ['#6366F1', '#4F46E5'];

export default function QuizScreen() {
  const [state, setState] = useState<QuizState>('selecting');
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const startQuiz = (chapter: Chapter) => {
    const chapterQuestions = CLASS_9_SCIENCE_QUIZ.filter(q => q.chapter === chapter.id);
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
    setShowExplanation(false);
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const checkAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    if (selectedOption === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowExplanation(false);
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
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={INDIGO_GRADIENT as any} style={styles.header}>
          <Text style={styles.headerTitle}>Practice Quiz</Text>
          <Text style={styles.headerSubtitle}>Master your concepts</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Select a Chapter</Text>
          {CLASS_9_SCIENCE.map((chapter) => (
            <TouchableOpacity
              key={chapter.id}
              style={styles.chapterCard}
              onPress={() => startQuiz(chapter)}
            >
              <View style={styles.chapterIconContainer}>
                <FontAwesome5 name="microscope" size={20} color={Colors.primary} />
              </View>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterName}>{chapter.title}</Text>
                <Text style={styles.questionCount}>{CLASS_9_SCIENCE_QUIZ.filter(q => q.chapter === chapter.id).length} Questions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
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
        <StatusBar barStyle="dark-content" />
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={resetQuiz} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={Colors.gray700} />
          </TouchableOpacity>
          <View style={styles.progressWrapper}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentQuestionIndex + 1} of {questions.length}
            </Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>Score: {score}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.quizContent}>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{question.question}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              let optionStyle = styles.optionCard;
              let textStyle = styles.optionText;

              if (isAnswered) {
                if (index === question.correctAnswer) {
                  optionStyle = { ...styles.optionCard, ...styles.correctOption };
                  textStyle = { ...styles.optionText, ...styles.correctOptionText };
                } else if (index === selectedOption) {
                  optionStyle = { ...styles.optionCard, ...styles.wrongOption };
                  textStyle = { ...styles.optionText, ...styles.wrongOptionText };
                }
              } else if (index === selectedOption) {
                optionStyle = { ...styles.optionCard, ...styles.selectedOption };
                textStyle = { ...styles.optionText, ...styles.selectedOptionText };
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={optionStyle}
                  onPress={() => handleOptionSelect(index)}
                  disabled={isAnswered}
                >
                  <View style={styles.optionIndex}>
                    <Text style={[styles.optionIndexText, index === selectedOption && styles.selectedOptionIndexText]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={textStyle}>{option}</Text>
                  {isAnswered && index === question.correctAnswer && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  )}
                  {isAnswered && index === selectedOption && index !== question.correctAnswer && (
                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {isAnswered && (
            <View style={styles.explanationCard}>
              <View style={styles.explanationHeader}>
                <Ionicons name="bulb" size={20} color={Colors.warning} />
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={INDIGO_GRADIENT as any} style={styles.header}>
        <Text style={styles.headerTitle}>Quiz Results</Text>
        <Text style={styles.headerSubtitle}>{currentChapter?.title}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.finishedScroll}>
        <View style={styles.finishedContainer}>
          <View style={styles.resultEmoji}>
            <Text style={{ fontSize: 80 }}>{score / questions.length >= 0.7 ? '🏆' : '📚'}</Text>
          </View>
          <Text style={styles.finishedTitle}>
            {score / questions.length >= 0.7 ? 'Fantastic Job!' : 'Keep Learning!'}
          </Text>
          <Text style={styles.finishedSubtitle}>
            You scored {score} out of {questions.length} questions
          </Text>
          
          <View style={styles.resultCard}>
            <View style={styles.resultStat}>
              <Text style={[styles.resultValue, { color: Colors.success }]}>{score}</Text>
              <Text style={styles.resultLabel}>Correct</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultStat}>
              <Text style={[styles.resultValue, { color: Colors.error }]}>{questions.length - score}</Text>
              <Text style={styles.resultLabel}>Incorrect</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultStat}>
              <Text style={[styles.resultValue, { color: Colors.primary }]}>
                {Math.round((score / questions.length) * 100)}%
              </Text>
              <Text style={styles.resultLabel}>Accuracy</Text>
            </View>
          </View>

          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={resetQuiz}>
              <Text style={styles.secondaryBtnText}>Back to Chapters</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => startQuiz(currentChapter)}
            >
              <LinearGradient colors={INDIGO_GRADIENT as any} style={styles.btnGradient}>
                <Text style={styles.primaryBtnText}>Retry Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    padding: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.gray800,
    marginBottom: 20,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    ...Shadows.md,
  },
  chapterIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterName: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.gray900,
  },
  questionCount: {
    fontSize: 13,
    color: Colors.gray500,
    marginTop: 2,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backBtn: {
    padding: 8,
  },
  progressWrapper: {
    flex: 1,
    paddingHorizontal: 15,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: 11,
    color: Colors.gray500,
    marginTop: 4,
    textAlign: 'center',
  },
  scoreBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  quizContent: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: Colors.white,
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    ...Shadows.lg,
  },
  questionText: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.gray900,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.sm,
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  correctOption: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  wrongOption: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  optionIndex: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIndexText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.gray600,
  },
  selectedOptionIndexText: {
    color: Colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.gray800,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontFamily: Fonts.semibold,
  },
  correctOptionText: {
    color: Colors.successDark,
    fontFamily: Fonts.semibold,
  },
  wrongOptionText: {
    color: Colors.errorDark,
    fontFamily: Fonts.semibold,
  },
  explanationCard: {
    marginTop: 24,
    padding: 20,
    backgroundColor: Colors.warningLight,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  explanationTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.warningDark,
  },
  explanationText: {
    fontSize: 14,
    color: Colors.warningDark,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  actionBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  disabledBtn: {
    backgroundColor: Colors.gray300,
  },
  finishedScroll: {
    flexGrow: 1,
  },
  finishedContainer: {
    padding: 24,
    alignItems: 'center',
  },
  resultEmoji: {
    marginTop: 20,
    marginBottom: 20,
  },
  finishedTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
    textAlign: 'center',
  },
  finishedSubtitle: {
    fontSize: 16,
    color: Colors.gray500,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 24,
    borderRadius: 24,
    marginVertical: 32,
    width: '100%',
    ...Shadows.lg,
  },
  resultStat: {
    flex: 1,
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
  resultLabel: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 4,
  },
  resultDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.gray100,
  },
  actionGrid: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    ...Shadows.md,
  },
  btnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.gray700,
    fontSize: 16,
    fontFamily: Fonts.semibold,
  },
});
