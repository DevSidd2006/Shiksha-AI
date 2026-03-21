import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  calculateStudyStats,
  formatTimeSpent,
  getMotivationalMessage,
  StudySession,
  StudentNote,
} from '@/features/content';
import { useAppTheme } from '@/shared';

type TabKey = 'stats' | 'notes';

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

export default function ProgressScreen() {
  const router = useRouter();
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [sessions, setSessions] = useState<StudySession[]>([
    {
      id: '1',
      chapterId: 1,
      type: 'flashcard',
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    },
    {
      id: '2',
      chapterId: 1,
      type: 'quiz',
      startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
      score: 85,
      totalQuestions: 6,
    },
    {
      id: '3',
      chapterId: 2,
      type: 'flashcard',
      startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000 + 25 * 60 * 1000),
    },
  ]);

  const [notes, setNotes] = useState<StudentNote[]>([
    {
      id: '1',
      chapterId: 1,
      title: 'States of Matter',
      content: 'Solids have fixed shape and volume. Liquids have fixed volume but no fixed shape.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      tags: ['important', 'chapter1'],
    },
  ]);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', chapterId: 1 });
  const [selectedTab, setSelectedTab] = useState<TabKey>('stats');

  const stats = calculateStudyStats(sessions);
  const motivationalMessage = getMotivationalMessage(stats);

  const handleAddNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const note: StudentNote = {
      id: Date.now().toString(),
      chapterId: newNote.chapterId,
      title: newNote.title,
      content: newNote.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    };

    setNotes((prev) => [note, ...prev]);
    setNewNote({ title: '', content: '', chapterId: 1 });
    setShowNoteModal(false);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerKicker}>Personal Dashboard</Text>
            <Text style={styles.headerTitle}>Growth Tracking</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.historyPill} onPress={() => router.push('/history')}>
              <Ionicons name="time-outline" size={16} color={theme.text} />
              <Text style={styles.historyPillText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.heroWrap}>
        <LinearGradient colors={theme.cardGradient as any} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Learning Progress</Text>
          <Text style={styles.heroSubtitle}>{motivationalMessage}</Text>
        </LinearGradient>
      </View>

      <View style={styles.tabWrap}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, selectedTab === 'stats' && styles.tabBtnActive]}
            onPress={() => setSelectedTab('stats')}
          >
            <Text style={[styles.tabText, selectedTab === 'stats' && styles.tabTextActive]}>Statistics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, selectedTab === 'notes' && styles.tabBtnActive]}
            onPress={() => setSelectedTab('notes')}
          >
            <Text style={[styles.tabText, selectedTab === 'notes' && styles.tabTextActive]}>Notes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedTab === 'stats' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? '#3A1620' : '#FEE2E2' }]}>
                <MaterialIcons name="local-fire-department" size={18} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>{stats.streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? '#162C45' : '#DBEAFE' }]}>
                <MaterialIcons name="schedule" size={18} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? '#123527' : '#DCFCE7' }]}>
                <MaterialIcons name="timer" size={18} color="#16A34A" />
              </View>
              <Text style={styles.statValue}>{formatTimeSpent(stats.totalTimeSpent)}</Text>
              <Text style={styles.statLabel}>Time Spent</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? '#3A2A12' : '#FEF3C7' }]}>
                <MaterialIcons name="school" size={18} color="#D97706" />
              </View>
              <Text style={styles.statValue}>{stats.chaptersCompleted}/3</Text>
              <Text style={styles.statLabel}>Chapters</Text>
            </View>
          </View>

          {stats.averageScore > 0 && (
            <View style={styles.scoreCard}>
              <View style={styles.scoreTop}>
                <Text style={styles.sectionTitle}>Average Quiz Score</Text>
                <Text style={styles.scoreValue}>{stats.averageScore}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${stats.averageScore}%` }]} />
              </View>
            </View>
          )}

          <View style={styles.activityCard}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {sessions.slice(0, 5).map((session) => (
              <View key={session.id} style={styles.activityRow}>
                <View style={[styles.activityIcon, { backgroundColor: session.type === 'quiz' ? '#FEE2E2' : '#E0E7FF' }]}>
                  <MaterialIcons
                    name={session.type === 'quiz' ? 'quiz' : 'layers'}
                    size={16}
                    color={session.type === 'quiz' ? '#DC2626' : '#4F46E5'}
                  />
                </View>
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityTitle}>
                    {session.type === 'quiz' ? 'Quiz' : 'Flashcards'} - Chapter {session.chapterId}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                {session.score !== undefined ? <Text style={styles.scoreChip}>{session.score}%</Text> : null}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.notesWrap}>
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.notesListContent}
            renderItem={({ item }) => (
              <View style={styles.noteCard}>
                <View style={styles.noteTop}>
                  <Text style={styles.noteTitle}>{item.title}</Text>
                  <TouchableOpacity onPress={() => handleDeleteNote(item.id)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.noteBody}>{item.content}</Text>
                <View style={styles.noteMetaRow}>
                  <View style={styles.noteBadge}>
                    <Text style={styles.noteBadgeText}>Chapter {item.chapterId}</Text>
                  </View>
                  <Text style={styles.noteDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={40} color={theme.textMuted} />
                <Text style={styles.emptyTitle}>No notes yet</Text>
                <Text style={styles.emptySubtitle}>Create your first note to track revision points.</Text>
              </View>
            }
          />

          <TouchableOpacity style={styles.addBtn} onPress={() => setShowNoteModal(true)}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Create Note</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showNoteModal} transparent animationType="slide" onRequestClose={() => setShowNoteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>New Note</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={newNote.title}
              onChangeText={(title) => setNewNote((prev) => ({ ...prev, title }))}
              placeholder="What's this about?"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={styles.inputLabel}>Details</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={newNote.content}
              onChangeText={(content) => setNewNote((prev) => ({ ...prev, content }))}
              placeholder="Write your key points"
              placeholderTextColor={theme.textMuted}
              multiline
            />

            <Text style={styles.inputLabel}>Chapter</Text>
            <View style={styles.chRow}>
              {[1, 2, 3].map((ch) => (
                <TouchableOpacity
                  key={ch}
                  style={[styles.chBtn, newNote.chapterId === ch && styles.chBtnActive]}
                  onPress={() => setNewNote((prev) => ({ ...prev, chapterId: ch }))}
                >
                  <Text style={[styles.chText, newNote.chapterId === ch && styles.chTextActive]}>CH {ch}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddNote}>
              <Text style={styles.saveBtnText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
      backgroundColor: theme.headerGradient[0],
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
    headerKicker: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 4,
    },
    headerTitle: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '800',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    historyPill: {
      height: 34,
      borderRadius: 12,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
    },
    historyPillText: {
      color: theme.text,
      fontSize: 13,
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
    heroWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
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
    tabWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 6,
    },
    tabRow: {
      flexDirection: 'row',
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 4,
    },
    tabBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
    },
    tabBtnActive: {
      backgroundColor: theme.panelSoft,
    },
    tabText: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    tabTextActive: {
      color: theme.text,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 30,
      gap: 14,
    },
    statGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    statCard: {
      width: '48.5%',
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 12,
      gap: 8,
    },
    statIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statValue: {
      color: theme.text,
      fontSize: 17,
      fontWeight: '800',
    },
    statLabel: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    scoreCard: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 14,
      gap: 12,
    },
    scoreTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '700',
    },
    scoreValue: {
      color: theme.accent,
      fontSize: 18,
      fontWeight: '800',
    },
    track: {
      width: '100%',
      height: 8,
      borderRadius: 999,
      backgroundColor: theme.panelSoft,
      overflow: 'hidden',
    },
    trackFill: {
      height: '100%',
      backgroundColor: '#22C55E',
      borderRadius: 999,
    },
    activityCard: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 14,
      gap: 10,
    },
    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
    },
    activityIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityTextWrap: {
      flex: 1,
    },
    activityTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '700',
    },
    activityMeta: {
      color: theme.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
    scoreChip: {
      color: '#22C55E',
      fontSize: 12,
      fontWeight: '800',
      backgroundColor: isDarkColor(theme) ? 'rgba(34,197,94,0.16)' : '#DCFCE7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    notesWrap: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 20,
    },
    notesListContent: {
      paddingBottom: 100,
      gap: 10,
    },
    noteCard: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
      gap: 8,
    },
    noteTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    noteTitle: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
    },
    noteBody: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
    noteMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    noteBadge: {
      backgroundColor: theme.panelSoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    noteBadgeText: {
      color: theme.text,
      fontSize: 11,
      fontWeight: '700',
    },
    noteDate: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },
    addBtn: {
      position: 'absolute',
      right: 16,
      bottom: 18,
      backgroundColor: theme.accent,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    addBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 50,
      gap: 8,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '700',
    },
    emptySubtitle: {
      color: theme.textMuted,
      fontSize: 12,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: theme.panel,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 10,
    },
    modalHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    modalTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '800',
    },
    inputLabel: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '700',
    },
    input: {
      width: '100%',
      backgroundColor: theme.panelSoft,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.text,
      fontSize: 14,
    },
    inputMultiline: {
      minHeight: 90,
      textAlignVertical: 'top',
    },
    chRow: {
      flexDirection: 'row',
      gap: 8,
    },
    chBtn: {
      flex: 1,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panelSoft,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
    },
    chBtnActive: {
      backgroundColor: theme.accent,
    },
    chText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '700',
    },
    chTextActive: {
      color: '#FFFFFF',
    },
    saveBtn: {
      marginTop: 6,
      borderRadius: 12,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
  });

const isDarkColor = (theme: ThemePalette) => theme.surface === '#06070B';
