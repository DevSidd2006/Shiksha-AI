import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Animated,
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CLASS_9_SCIENCE, Chapter } from '@/features/content';
import { CLASS_9_SCIENCE_QUIZ, QuizQuestion } from '@/features/content';
import { recordQuizCompletion } from '@/features/progress';
import { useAppTheme } from '@/shared';
import { DARK_THEME, LIGHT_THEME, AppTheme, Spacing } from '@/shared';

type QuizState = 'selecting' | 'active' | 'finished';

const CHAPTER_COLORS = ['#818CF8','#34D399','#F59E0B','#F472B6','#60A5FA','#A78BFA'];
const OPTION_LETTERS = ['A','B','C','D'];

export default function QuizScreen() {
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  const theme: AppTheme = isDark ? DARK_THEME : LIGHT_THEME;
  const styles = useMemo(() => createStyles(theme, isDark), [theme]);

  const [state, setState] = useState<QuizState>('selecting');
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.94);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  };

  const shakeWrong = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const startQuiz = (chapter: Chapter) => {
    const qs = CLASS_9_SCIENCE_QUIZ.filter(q => q.chapter === chapter.id);
    if (!qs.length) {
      Alert.alert('Coming Soon', 'Questions for this chapter are being added!');
      return;
    }
    setCurrentChapter(chapter);
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setState('active');
    setSelectedOpt(null);
    setIsAnswered(false);
    animateIn();
  };

  const checkAnswer = () => {
    if (selectedOpt === null) return;
    setIsAnswered(true);
    if (selectedOpt === questions[currentQ].correctAnswer) {
      setScore(p => p + 1);
    } else {
      shakeWrong();
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 < questions.length) {
      animateIn();
      setCurrentQ(p => p + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setState('finished');
    }
  };

  const resetQuiz = () => {
    setState('selecting');
    setCurrentChapter(null);
    setSelectedOpt(null);
    setIsAnswered(false);
    setCurrentQ(0);
    setScore(0);
  };

  // ── Chapter selection ───────────────────────────────────────────────────────
  if (state === 'selecting') {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <LinearGradient colors={theme.headerGradient as any} style={styles.header}>
          <View style={styles.hRow}>
            <View>
              <Text style={styles.hKicker}>KNOWLEDGE CHECK</Text>
              <Text style={styles.hTitle}>Practice Quiz</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <LinearGradient colors={theme.cardGradient as any} style={styles.heroCard}>
            <MaterialCommunityIcons name="head-check-outline" size={28} color={theme.accent} />
            <Text style={styles.heroTitle}>Test Your Knowledge</Text>
            <Text style={styles.heroSubtitle}>Pick a chapter and challenge yourself with MCQs. Explanations included!</Text>
          </LinearGradient>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Select a Chapter</Text>
          {CLASS_9_SCIENCE.map((ch, i) => {
            const qCount = CLASS_9_SCIENCE_QUIZ.filter(q => q.chapter === ch.id).length;
            const col = CHAPTER_COLORS[i % CHAPTER_COLORS.length];
            return (
              <TouchableOpacity
                key={ch.id}
                style={styles.chapterCard}
                onPress={() => startQuiz(ch)}
                activeOpacity={0.82}
              >
                <LinearGradient
                  colors={[`${col}22`, `${col}10`]}
                  style={styles.chIcon}
                >
                  <MaterialCommunityIcons name="microscope" size={20} color={col} />
                </LinearGradient>
                <View style={styles.chInfo}>
                  <Text style={styles.chTitle}>{ch.title}</Text>
                  <Text style={styles.chSub}>{qCount} questions</Text>
                </View>
                <View style={[styles.chBadge, { backgroundColor: `${col}18` }]}>
                  <Text style={[styles.chBadgeText, { color: col }]}>Start</Text>
                  <Ionicons name="arrow-forward" size={13} color={col} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Active quiz ─────────────────────────────────────────────────────────────
  if (state === 'active') {
    const question = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;

    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <View style={styles.quizHeader}>
          <TouchableOpacity style={styles.iconBtn} onPress={resetQuiz}>
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: theme.panelSoft }]}>
              <Animated.View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.accent }]} />
            </View>
            <Text style={styles.progressTxt}>{currentQ + 1} of {questions.length}</Text>
          </View>

          <View style={[styles.scorePill, { backgroundColor: isDark ? theme.chipBg : '#EEF2FF' }]}>
            <Ionicons name="star" size={13} color={theme.accent} />
            <Text style={[styles.scorePillTxt, { color: theme.accent }]}>{score} pts</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.quizContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] }}>
            {/* Question card */}
            <LinearGradient
              colors={isDark ? ['#14192E','#0F1320'] : ['#EEF2FF','#F4F6FF']}
              style={styles.qCard}
            >
              <Text style={styles.qNumber}>Question {currentQ + 1}</Text>
              <Text style={styles.qText}>{question.question}</Text>
            </LinearGradient>

            {/* Options */}
            <View style={styles.optionsWrap}>
              {question.options.map((opt, idx) => {
                const isCorrect     = isAnswered && idx === question.correctAnswer;
                const isWrong       = isAnswered && idx === selectedOpt && idx !== question.correctAnswer;
                const isSelected    = !isAnswered && idx === selectedOpt;
                let bgColor   = theme.panel;
                let border    = theme.border;
                let textColor = theme.text;
                let badgeBg   = theme.panelSoft;
                let badgeTxt  = theme.textMuted;

                if (isSelected) {
                  bgColor   = isDark ? '#1C2040' : '#EEF2FF';
                  border    = theme.accent;
                  badgeBg   = theme.accent;
                  badgeTxt  = '#FFFFFF';
                } else if (isCorrect) {
                  bgColor   = isDark ? '#0D2B1E' : '#D1FAE5';
                  border    = '#10B981';
                  textColor = isDark ? '#34D399' : '#065F46';
                  badgeBg   = '#10B981';
                  badgeTxt  = '#FFFFFF';
                } else if (isWrong) {
                  bgColor   = isDark ? '#2D1212' : '#FEE2E2';
                  border    = '#EF4444';
                  textColor = isDark ? '#F87171' : '#991B1B';
                  badgeBg   = '#EF4444';
                  badgeTxt  = '#FFFFFF';
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.optCard, { backgroundColor: bgColor, borderColor: border }]}
                    onPress={() => setSelectedOpt(idx)}
                    disabled={isAnswered}
                    activeOpacity={0.82}
                  >
                    <View style={[styles.optBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.optBadgeTxt, { color: badgeTxt }]}>{OPTION_LETTERS[idx]}</Text>
                    </View>
                    <Text style={[styles.optText, { color: textColor }]}>{opt}</Text>
                    {isCorrect && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                    {isWrong   && <Ionicons name="close-circle"     size={20} color="#EF4444" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Explanation */}
            {isAnswered && (
              <Animated.View style={[styles.explanationCard, { opacity: fadeAnim }]}>
                <View style={styles.explanationHeader}>
                  <View style={[styles.bulbIcon, { backgroundColor: isDark ? '#2D2308' : '#FEF3C7' }]}>
                    <Ionicons name="bulb" size={16} color="#F59E0B" />
                  </View>
                  <Text style={styles.explanationTitle}>Explanation</Text>
                </View>
                <Text style={styles.explanationText}>{question.explanation}</Text>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {!isAnswered ? (
            <TouchableOpacity
              style={[styles.footerBtn, { backgroundColor: theme.buttonBg, opacity: selectedOpt === null ? 0.5 : 1 }]}
              onPress={checkAnswer}
              disabled={selectedOpt === null}
            >
              <Text style={[styles.footerBtnTxt, { color: theme.buttonText }]}>Check Answer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.footerBtn, { backgroundColor: theme.buttonBg }]} onPress={nextQuestion}>
              <Text style={[styles.footerBtnTxt, { color: theme.buttonText }]}>
                {currentQ + 1 === questions.length ? '🎉 See Results' : 'Next Question'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={theme.buttonText} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  const accuracy = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const level = accuracy >= 80 ? { emoji: '🏆', label: 'Excellent!', col: '#10B981' }
              : accuracy >= 50 ? { emoji: '👍', label: 'Good job!', col: '#F59E0B' }
              :                  { emoji: '💪', label: 'Keep going!', col: '#EF4444' };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient colors={theme.headerGradient as any} style={styles.header}>
        <View style={styles.hRow}>
          <View>
            <Text style={styles.hKicker}>QUIZ COMPLETE</Text>
            <Text style={styles.hTitle}>Results</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
        {/* Score hero */}
        <LinearGradient
          colors={isDark ? ['#1C2040','#131729'] : ['#6366F1','#818CF8']}
          style={styles.resultHero}
        >
          <Text style={styles.resultEmoji}>{level.emoji}</Text>
          <Text style={styles.resultLabel}>{level.label}</Text>
          <Text style={styles.resultScore}>{accuracy}%</Text>
          <Text style={styles.resultSub}>{score} / {questions.length} correct</Text>
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.resultStats}>
          {[
            { val: score,                     lbl: 'Correct',   col: '#10B981' },
            { val: questions.length - score,  lbl: 'Incorrect', col: '#EF4444' },
            { val: `${accuracy}%`,            lbl: 'Accuracy',  col: theme.accent },
          ].map(s => (
            <View key={s.lbl} style={styles.resultStatBox}>
              <Text style={[styles.resultStatVal, { color: s.col }]}>{s.val}</Text>
              <Text style={styles.resultStatLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.retryBtn} onPress={() => currentChapter && startQuiz(currentChapter)}>
            <Ionicons name="refresh" size={18} color={theme.buttonText} />
            <Text style={[styles.footerBtnTxt, { color: theme.buttonText }]}>Retry Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={resetQuiz}>
            <Text style={[styles.footerBtnTxt, { color: theme.textMuted }]}>Back to Chapters</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.surface },

    header:    { paddingHorizontal: Spacing.lg, paddingBottom: 16 },
    hRow:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingTop:8, marginBottom:14 },
    hKicker:   { color: theme.textMuted, fontSize:10, fontWeight:'800', letterSpacing:1, marginBottom:2 },
    hTitle:    { color: theme.text, fontSize:26, fontWeight:'800' },
    iconBtn:   { width:36, height:36, borderRadius:12, backgroundColor:theme.panel, borderWidth:1, borderColor:theme.border, justifyContent:'center', alignItems:'center' },

    heroCard: { borderRadius:18, borderWidth:1, borderColor:theme.border, padding:16, gap:6 },
    heroTitle: { color:theme.text, fontSize:18, fontWeight:'800' },
    heroSubtitle: { color:theme.textMuted, fontSize:13, lineHeight:20 },

    listContent: { paddingHorizontal:Spacing.lg, paddingTop:12, paddingBottom:30 },
    sectionLabel: { color:theme.text, fontSize:15, fontWeight:'800', marginBottom:10 },

    chapterCard: { flexDirection:'row', alignItems:'center', backgroundColor:theme.panel, borderWidth:1, borderColor:theme.border, borderRadius:16, padding:14, marginBottom:10 },
    chIcon: { width:44, height:44, borderRadius:12, justifyContent:'center', alignItems:'center', marginRight:12 },
    chInfo: { flex:1 },
    chTitle: { color:theme.text, fontSize:14, fontWeight:'700', marginBottom:2 },
    chSub: { color:theme.textMuted, fontSize:12, fontWeight:'600' },
    chBadge: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:5, borderRadius:999 },
    chBadgeText: { fontSize:12, fontWeight:'800' },

    quizHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:Spacing.lg, paddingVertical:12, gap:10 },
    progressWrap: { flex:1, gap:4 },
    progressTrack: { height:8, borderRadius:999, overflow:'hidden' },
    progressFill: { height:'100%', borderRadius:999 },
    progressTxt: { color:theme.textMuted, fontSize:11, fontWeight:'700', textAlign:'center' },
    scorePill: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:5, borderRadius:999 },
    scorePillTxt: { fontSize:13, fontWeight:'800' },

    quizContent: { paddingHorizontal:Spacing.lg, paddingTop:10, paddingBottom:20, gap:12 },
    qCard: { borderRadius:20, padding:20, borderWidth:1, borderColor:theme.border, gap:8 },
    qNumber: { color:theme.accent, fontSize:11, fontWeight:'800', letterSpacing:0.6 },
    qText: { color:theme.text, fontSize:18, fontWeight:'700', lineHeight:28 },

    optionsWrap: { gap:10 },
    optCard: { flexDirection:'row', alignItems:'center', borderRadius:14, borderWidth:1.5, padding:14, gap:12 },
    optBadge: { width:28, height:28, borderRadius:9, justifyContent:'center', alignItems:'center' },
    optBadgeTxt: { fontSize:12, fontWeight:'800' },
    optText: { flex:1, fontSize:14, fontWeight:'600', lineHeight:22 },

    explanationCard: { backgroundColor: isDark ? '#0F1720' : '#F0FDF4', borderRadius:14, borderWidth:1, borderColor: isDark ? '#1A3D2B' : '#A7F3D0', padding:14 },
    explanationHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 },
    bulbIcon: { width:30, height:30, borderRadius:9, justifyContent:'center', alignItems:'center' },
    explanationTitle: { color:theme.text, fontSize:13, fontWeight:'800' },
    explanationText: { color:theme.textMuted, fontSize:13, lineHeight:21 },

    footer: { paddingHorizontal:Spacing.lg, paddingVertical:14, borderTopWidth:1, borderTopColor:theme.border, backgroundColor:theme.panel },
    footerBtn: { height:50, borderRadius:14, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:8 },
    footerBtnTxt: { fontSize:15, fontWeight:'800' },

    resultScroll: { paddingBottom:30 },
    resultHero: { margin:Spacing.lg, borderRadius:24, padding:30, alignItems:'center', gap:6 },
    resultEmoji: { fontSize:44 },
    resultLabel: { color:'rgba(255,255,255,0.85)', fontSize:16, fontWeight:'700' },
    resultScore: { color:'#FFFFFF', fontSize:56, fontWeight:'800' },
    resultSub: { color:'rgba(255,255,255,0.7)', fontSize:14, fontWeight:'600' },

    resultStats: { flexDirection:'row', marginHorizontal:Spacing.lg, backgroundColor:theme.panel, borderRadius:16, borderWidth:1, borderColor:theme.border, paddingVertical:16 },
    resultStatBox: { flex:1, alignItems:'center' },
    resultStatVal: { fontSize:24, fontWeight:'800' },
    resultStatLbl: { color:theme.textMuted, fontSize:11, fontWeight:'600', marginTop:2 },

    resultActions: { gap:10, paddingHorizontal:Spacing.lg, marginTop:16 },
    retryBtn: { height:50, borderRadius:14, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:8, backgroundColor:theme.buttonBg },
    backBtn: { height:50, borderRadius:14, justifyContent:'center', alignItems:'center', backgroundColor:theme.panelSoft, borderWidth:1, borderColor:theme.border },
  });
}
