import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Animated,
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, TextInput, FlatList, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  calculateStudyStats, formatTimeSpent, getMotivationalMessage,
  StudySession, StudentNote,
} from '@/features/content';
import { useAppTheme } from '@/shared';
import { DARK_THEME, LIGHT_THEME, AppTheme, Spacing } from '@/shared';

type TabKey = 'stats' | 'notes';

export default function ProgressScreen() {
  const router = useRouter();
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  const theme: AppTheme = isDark ? DARK_THEME : LIGHT_THEME;
  const styles = useMemo(() => createStyles(theme, isDark), [theme]);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const [sessions] = useState<StudySession[]>([
    { id:'1', chapterId:1, type:'flashcard', startTime:new Date(Date.now()-2*86400000), endTime:new Date(Date.now()-2*86400000+1800000) },
    { id:'2', chapterId:1, type:'quiz',      startTime:new Date(Date.now()-86400000),   endTime:new Date(Date.now()-86400000+1200000), score:85, totalQuestions:6 },
    { id:'3', chapterId:2, type:'flashcard', startTime:new Date(Date.now()-3600000),    endTime:new Date(Date.now()-3600000+1500000) },
  ]);

  const [notes, setNotes] = useState<StudentNote[]>([
    { id:'1', chapterId:1, title:'States of Matter', content:'Solids have fixed shape and volume. Liquids have fixed volume but no fixed shape.', createdAt:new Date(Date.now()-3*86400000), updatedAt:new Date(Date.now()-3*86400000), tags:['important','chapter1'] },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState({ title:'', content:'', chapterId:1 });
  const [selectedTab, setSelectedTab] = useState<TabKey>('stats');

  const stats   = calculateStudyStats(sessions);
  const message = getMotivationalMessage(stats);

  const addNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;
    setNotes(p => [{
      id: Date.now().toString(),
      chapterId: newNote.chapterId,
      title: newNote.title,
      content: newNote.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    }, ...p]);
    setNewNote({ title:'', content:'', chapterId:1 });
    setShowModal(false);
  };

  const STAT_CARDS = [
    { icon:'local-fire-department' as const, val: String(stats.streakDays),  label:'Day Streak',  col:'#F97316', bg: isDark?'#2D1A08':'#FFEDD5' },
    { icon:'schedule'              as const, val: String(stats.totalSessions),label:'Sessions',    col:'#6366F1', bg: isDark?'#171B3D':'#EEF2FF' },
    { icon:'timer'                 as const, val: formatTimeSpent(stats.totalTimeSpent), label:'Study Time', col:'#10B981', bg: isDark?'#0C2B1E':'#D1FAE5' },
    { icon:'school'                as const, val: `${stats.chaptersCompleted}/3`, label:'Chapters', col:'#F59E0B', bg: isDark?'#2D2208':'#FEF3C7' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <LinearGradient colors={theme.headerGradient as any} style={styles.header}>
        <View style={styles.hRow}>
          <View>
            <Text style={styles.hKicker}>PERSONAL DASHBOARD</Text>
            <Text style={styles.hTitle}>My Progress</Text>
          </View>
          <View style={styles.hActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/history')}>
              <Ionicons name="time-outline" size={18} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
              <Ionicons name={isDark?'sunny-outline':'moon-outline'} size={18} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero motivational card */}
        <LinearGradient colors={theme.cardGradient as any} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Learning Progress</Text>
          <Text style={styles.heroMessage}>{message}</Text>
          <View style={styles.heroBarRow}>
            <View style={styles.heroTrack}>
              <View style={[styles.heroFill, { width:`${Math.min(stats.averageScore || 70, 100)}%` }]} />
            </View>
            <Text style={styles.heroBarLabel}>{stats.averageScore || 70}%</Text>
          </View>
        </LinearGradient>
      </LinearGradient>

      {/* Tab switcher */}
      <View style={styles.tabStrip}>
        {(['stats','notes'] as TabKey[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, selectedTab === t && { backgroundColor: theme.accent }]}
            onPress={() => setSelectedTab(t)}
          >
            <Ionicons
              name={t === 'stats' ? 'bar-chart-outline' : 'document-text-outline'}
              size={15}
              color={selectedTab === t ? '#FFFFFF' : theme.textMuted}
            />
            <Text style={[styles.tabTxt, selectedTab === t && { color:'#FFFFFF', fontWeight:'800' }]}>
              {t === 'stats' ? 'Statistics' : 'My Notes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Stats tab ─────────────────────────────────────────────────────── */}
      {selectedTab === 'stats' ? (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={{ opacity: fadeAnim }}
        >
          {/* Stat grid */}
          <View style={styles.statGrid}>
            {STAT_CARDS.map(s => (
              <View key={s.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                  <MaterialIcons name={s.icon} size={20} color={s.col} />
                </View>
                <Text style={[styles.statVal, { color: s.col }]}>{s.val}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Average score bar */}
          {stats.averageScore > 0 && (
            <View style={styles.scoreCard}>
              <View style={styles.scoreRow}>
                <Text style={styles.sectionTitle}>Quiz Average</Text>
                <Text style={[styles.scorePct, { color: theme.accent }]}>{stats.averageScore}%</Text>
              </View>
              <View style={styles.scoreTrack}>
                <Animated.View style={[styles.scoreFill, { width:`${Math.min(stats.averageScore,100)}%` }]} />
              </View>
            </View>
          )}

          {/* Recent activity */}
          <View style={styles.activityCard}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {sessions.slice(0, 5).map((s, i) => (
              <View key={s.id} style={[styles.actRow, i !== 0 && { borderTopWidth:1, borderTopColor:theme.border }]}>
                <View style={[styles.actIcon, { backgroundColor: s.type==='quiz' ? (isDark?'#2D1212':'#FEE2E2') : (isDark?'#171B3D':'#EEF2FF') }]}>
                  <MaterialIcons name={s.type==='quiz'?'quiz':'layers'} size={16} color={s.type==='quiz'?'#EF4444':'#6366F1'} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={styles.actTitle}>{s.type==='quiz' ? 'Quiz' : 'Flashcards'} — Chapter {s.chapterId}</Text>
                  <Text style={styles.actMeta}>{new Date(s.startTime).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</Text>
                </View>
                {s.score !== undefined && (
                  <View style={[styles.actScoreChip, { backgroundColor: isDark?'rgba(34,197,94,0.15)':'#D1FAE5' }]}>
                    <Text style={[styles.actScoreTxt, { color: isDark?'#34D399':'#065F46' }]}>{s.score}%</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </Animated.ScrollView>

      ) : (
      // ── Notes tab ────────────────────────────────────────────────────────
        <View style={{ flex:1 }}>
          <FlatList
            data={notes}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.notesContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.noteCard}>
                <View style={styles.noteTop}>
                  <View style={styles.noteIconBg}>
                    <Ionicons name="document-text" size={16} color={theme.accent} />
                  </View>
                  <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
                  <TouchableOpacity onPress={() => setNotes(p => p.filter(n => n.id !== item.id))}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.noteBody} numberOfLines={3}>{item.content}</Text>
                <View style={styles.noteFooter}>
                  <View style={[styles.noteBadge, { backgroundColor: isDark?theme.chipBg:'#EEF2FF' }]}>
                    <Text style={[styles.noteBadgeTxt, { color: theme.accent }]}>Chapter {item.chapterId}</Text>
                  </View>
                  <Text style={styles.noteDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={44} color={theme.textMuted} />
                <Text style={styles.emptyTitle}>No notes yet</Text>
                <Text style={styles.emptySub}>Tap + to create your first revision note.</Text>
              </View>
            }
          />
          <TouchableOpacity style={[styles.fab, { backgroundColor: theme.accent }]} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text style={styles.fabText}>New Note</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* New note modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>New Note</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={newNote.title}
              onChangeText={t => setNewNote(p => ({...p, title:t}))}
              placeholder="What's this about?"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={newNote.content}
              onChangeText={t => setNewNote(p => ({...p, content:t}))}
              placeholder="Write your key points…"
              placeholderTextColor={theme.textMuted}
              multiline
            />

            <Text style={styles.inputLabel}>Chapter</Text>
            <View style={styles.chRow}>
              {[1,2,3].map(ch => (
                <TouchableOpacity
                  key={ch}
                  style={[styles.chBtn, newNote.chapterId===ch && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => setNewNote(p => ({...p, chapterId:ch}))}
                >
                  <Text style={[styles.chBtnTxt, newNote.chapterId===ch && { color:'#FFFFFF' }]}>CH {ch}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={addNote}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.saveTxt}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme, isDark: boolean) {
  return StyleSheet.create({
    root: { flex:1, backgroundColor:theme.surface },

    header: { paddingHorizontal:Spacing.lg, paddingBottom:16 },
    hRow:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingTop:8, marginBottom:14 },
    hKicker: { color:theme.textMuted, fontSize:10, fontWeight:'800', letterSpacing:1, marginBottom:2 },
    hTitle:  { color:theme.text, fontSize:26, fontWeight:'800' },
    hActions: { flexDirection:'row', gap:8 },
    iconBtn: { width:36, height:36, borderRadius:12, backgroundColor:theme.panel, borderWidth:1, borderColor:theme.border, justifyContent:'center', alignItems:'center' },

    heroCard: { borderRadius:18, padding:16, borderWidth:1, borderColor:theme.border, gap:8 },
    heroTitle:   { color:theme.text, fontSize:17, fontWeight:'800' },
    heroMessage: { color:theme.textMuted, fontSize:13, lineHeight:20 },
    heroBarRow:  { flexDirection:'row', alignItems:'center', gap:10 },
    heroTrack:   { flex:1, height:8, borderRadius:999, backgroundColor:theme.panelSoft, overflow:'hidden' },
    heroFill:    { height:'100%', backgroundColor:theme.accent, borderRadius:999 },
    heroBarLabel: { color:theme.accent, fontSize:13, fontWeight:'800' },

    tabStrip: { flexDirection:'row', marginHorizontal:Spacing.lg, marginVertical:12, backgroundColor:theme.panel, borderRadius:14, padding:4, borderWidth:1, borderColor:theme.border },
    tabBtn:   { flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6, paddingVertical:9, borderRadius:10 },
    tabTxt:   { color:theme.textMuted, fontSize:13, fontWeight:'700' },

    scrollContent: { paddingHorizontal:Spacing.lg, paddingTop:4, paddingBottom:30, gap:12 },

    statGrid: { flexDirection:'row', flexWrap:'wrap', gap:10 },
    statCard: { width:'48.5%', backgroundColor:theme.panel, borderRadius:16, borderWidth:1, borderColor:theme.border, padding:14, gap:8 },
    statIcon: { width:38, height:38, borderRadius:11, alignItems:'center', justifyContent:'center' },
    statVal:  { fontSize:20, fontWeight:'800' },
    statLbl:  { color:theme.textMuted, fontSize:12, fontWeight:'600' },

    scoreCard:  { backgroundColor:theme.panel, borderRadius:16, borderWidth:1, borderColor:theme.border, padding:14, gap:10 },
    scoreRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
    sectionTitle: { color:theme.text, fontSize:15, fontWeight:'800' },
    scorePct:   { fontSize:18, fontWeight:'800' },
    scoreTrack: { height:8, borderRadius:999, backgroundColor:theme.panelSoft, overflow:'hidden' },
    scoreFill:  { height:'100%', backgroundColor:theme.accent, borderRadius:999 },

    activityCard: { backgroundColor:theme.panel, borderRadius:16, borderWidth:1, borderColor:theme.border, padding:14, gap:10 },
    actRow:  { flexDirection:'row', alignItems:'center', paddingVertical:8, gap:10 },
    actIcon: { width:34, height:34, borderRadius:10, justifyContent:'center', alignItems:'center' },
    actTitle: { color:theme.text, fontSize:13, fontWeight:'700' },
    actMeta:  { color:theme.textMuted, fontSize:11, marginTop:2 },
    actScoreChip: { paddingHorizontal:8, paddingVertical:4, borderRadius:999 },
    actScoreTxt:  { fontSize:12, fontWeight:'800' },

    notesContent: { paddingHorizontal:Spacing.lg, paddingTop:6, paddingBottom:90, gap:10 },
    noteCard:  { backgroundColor:theme.panel, borderRadius:16, borderWidth:1, borderColor:theme.border, padding:14, gap:10 },
    noteTop:   { flexDirection:'row', alignItems:'center', gap:8 },
    noteIconBg:{ width:30, height:30, borderRadius:9, backgroundColor:isDark?theme.chipBg:'#EEF2FF', justifyContent:'center', alignItems:'center' },
    noteTitle: { flex:1, color:theme.text, fontSize:14, fontWeight:'800' },
    noteBody:  { color:theme.textMuted, fontSize:13, lineHeight:20 },
    noteFooter:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
    noteBadge: { paddingHorizontal:10, paddingVertical:4, borderRadius:999 },
    noteBadgeTxt:{ fontSize:11, fontWeight:'700' },
    noteDate:  { color:theme.textMuted, fontSize:11, fontWeight:'600' },

    emptyState: { alignItems:'center', paddingVertical:50, gap:8 },
    emptyTitle: { color:theme.text, fontSize:16, fontWeight:'700' },
    emptySub:   { color:theme.textMuted, fontSize:13, textAlign:'center' },

    fab: { position:'absolute', right:Spacing.lg, bottom:20, flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:16, paddingVertical:12, borderRadius:999 },
    fabText: { color:'#FFFFFF', fontSize:14, fontWeight:'800' },

    modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
    modalCard: { backgroundColor:theme.panel, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, borderWidth:1, borderColor:theme.border, gap:12 },
    modalHandle: { width:40, height:4, borderRadius:2, backgroundColor:theme.border, alignSelf:'center', marginBottom:4 },
    modalHead: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
    modalTitle: { color:theme.text, fontSize:20, fontWeight:'800' },
    closeBtn: { width:30, height:30, borderRadius:9, backgroundColor:theme.panelSoft, justifyContent:'center', alignItems:'center' },
    inputLabel: { color:theme.textMuted, fontSize:11, fontWeight:'800', letterSpacing:0.5 },
    input: { backgroundColor:theme.panelSoft, borderWidth:1, borderColor:theme.border, borderRadius:12, paddingHorizontal:14, paddingVertical:11, color:theme.text, fontSize:14 },
    inputMulti: { minHeight:90, textAlignVertical:'top' },
    chRow: { flexDirection:'row', gap:8 },
    chBtn: { flex:1, borderRadius:10, borderWidth:1, borderColor:theme.border, backgroundColor:theme.panelSoft, alignItems:'center', paddingVertical:10 },
    chBtnTxt: { color:theme.textMuted, fontSize:12, fontWeight:'800' },
    saveBtn: { flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6, borderRadius:12, paddingVertical:13 },
    saveTxt: { color:'#FFFFFF', fontSize:15, fontWeight:'800' },
  });
}
