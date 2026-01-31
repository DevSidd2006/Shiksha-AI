import React, { useState, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '@/styles/designSystem';
import {
  calculateStudyStats,
  formatTimeSpent,
  getMotivationalMessage,
  StudySession,
  StudentNote,
} from '@/data/studyProgress';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
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
  const [selectedTab, setSelectedTab] = useState<'stats' | 'notes'>('stats');

  const stats = calculateStudyStats(sessions);
  const motivationalMessage = getMotivationalMessage(stats);

  const handleAddNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      const note: StudentNote = {
        id: Date.now().toString(),
        chapterId: newNote.chapterId,
        title: newNote.title,
        content: newNote.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };
      setNotes([...notes, note]);
      setNewNote({ title: '', content: '', chapterId: 1 });
      setShowNoteModal(false);
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const chapterNotes = notes.filter(n => n.chapterId === 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#6366F1', '#4F46E5'] as any} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.headerSubtitle}>Personal Dashboard</Text>
          <Text style={styles.headerTitle}>Growth Tracking</Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'stats' && styles.tabActive]}
            onPress={() => setSelectedTab('stats')}
          >
            <Text style={[styles.tabText, selectedTab === 'stats' && styles.tabTextActive]}>Statistics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'notes' && styles.tabActive]}
            onPress={() => setSelectedTab('notes')}
          >
            <Text style={[styles.tabText, selectedTab === 'notes' && styles.tabTextActive]}>Notes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedTab === 'stats' ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#ECFDF5', '#D1FAE5'] as any}
            style={styles.motivationalCard}
          >
            <FontAwesome5 name="lightbulb" size={24} color="#10B981" />
            <Text style={styles.motivationalText}>{motivationalMessage}</Text>
          </LinearGradient>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <MaterialIcons name="local-fire-department" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>{stats.streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                <MaterialIcons name="schedule" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                <MaterialIcons name="timer" size={24} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{formatTimeSpent(stats.totalTimeSpent)}</Text>
              <Text style={styles.statLabel}>Time Spent</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="school" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{stats.chaptersCompleted}/3</Text>
              <Text style={styles.statLabel}>Chapters</Text>
            </View>
          </View>

          {stats.averageScore > 0 && (
            <View style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreTitle}>Average Quiz Score</Text>
                <Text style={styles.scoreValue}>{stats.averageScore}%</Text>
              </View>
              <View style={styles.scoreBar}>
                <LinearGradient
                  colors={['#10B981', '#059669'] as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.scoreBarFill, { width: `${stats.averageScore}%` }]}
                />
              </View>
            </View>
          )}

          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            {sessions.slice(0, 5).map((session, index) => (
              <View key={session.id} style={[styles.activityItem, index !== 0 && styles.activityItemBorder]}>
                <View style={[styles.activityIcon, { backgroundColor: session.type === 'quiz' ? '#FEF2F2' : '#F5F3FF' }]}>
                  <MaterialIcons
                    name={session.type === 'quiz' ? 'quiz' : 'layers'}
                    size={20}
                    color={session.type === 'quiz' ? '#EF4444' : '#6366F1'}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityType}>
                    {session.type === 'quiz' ? 'Quiz' : 'Flashcards'} - Chapter {session.chapterId}
                  </Text>
                  <Text style={styles.activityTime}>
                    {new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                {session.score !== undefined && (
                  <View style={styles.activityScore}>
                    <Text style={styles.activityScoreText}>{session.score}%</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.notesContainer}>
          <FlatList
            data={notes}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteTitle}>{item.title}</Text>
                  <TouchableOpacity onPress={() => handleDeleteNote(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.noteContent}>{item.content}</Text>
                <View style={styles.noteFooter}>
                  <View style={styles.chapterBadge}>
                    <Text style={styles.chapterBadgeText}>Chapter {item.chapterId}</Text>
                  </View>
                  <Text style={styles.noteDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.notesList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="document-text-outline" size={48} color={Colors.gray300} />
                </View>
                <Text style={styles.emptyText}>No notes recorded yet</Text>
                <Text style={styles.emptySubtext}>Your quick study notes will appear here</Text>
              </View>
            }
          />
          <TouchableOpacity
            style={styles.addNoteButton}
            onPress={() => setShowNoteModal(true)}
          >
            <LinearGradient
              colors={['#6366F1', '#4F46E5'] as any}
              style={styles.addNoteGradient}
            >
              <Ionicons name="add" size={24} color={Colors.white} />
              <Text style={styles.addNoteButtonText}>Create New Note</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Note</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Ionicons name="close" size={24} color={Colors.gray900} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="What's this about?"
                value={newNote.title}
                onChangeText={text => setNewNote({ ...newNote, title: text })}
                placeholderTextColor={Colors.gray400}
              />

              <Text style={styles.inputLabel}>Note Details</Text>
              <TextInput
                style={[styles.input, styles.contentInput]}
                placeholder="Jot down your key points..."
                value={newNote.content}
                onChangeText={text => setNewNote({ ...newNote, content: text })}
                multiline
                placeholderTextColor={Colors.gray400}
              />

              <Text style={styles.inputLabel}>Select Chapter</Text>
              <View style={styles.chapterSelector}>
                {[1, 2, 3].map(ch => (
                  <TouchableOpacity
                    key={ch}
                    style={[
                      styles.chapterOption,
                      newNote.chapterId === ch && styles.chapterOptionActive,
                    ]}
                    onPress={() => setNewNote({ ...newNote, chapterId: ch })}
                  >
                    <Text
                      style={[
                        styles.chapterOptionText,
                        newNote.chapterId === ch && styles.chapterOptionTextActive,
                      ]}
                    >
                      CH {ch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddNote}>
              <LinearGradient
                colors={['#6366F1', '#4F46E5'] as any}
                style={styles.saveGradient}
              >
                <Text style={styles.saveButtonText}>Save Note</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 5,
  },
  tabWrapper: {
    marginTop: -25,
    paddingHorizontal: Spacing.xl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 6,
    ...Colors.cardShadow as any,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray400,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 40,
  },
  motivationalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: 20,
    marginBottom: Spacing.xl,
    gap: 15,
  },
  motivationalText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#065F46',
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    alignItems: 'flex-start',
    ...Colors.cardShadow as any,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.gray900,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.gray500,
    marginTop: 4,
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Colors.cardShadow as any,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray900,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  scoreBar: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  activityCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    ...Colors.cardShadow as any,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray900,
    marginBottom: 15,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 15,
  },
  activityItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityType: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray900,
  },
  activityTime: {
    fontSize: 13,
    color: Colors.gray500,
    marginTop: 2,
  },
  activityScore: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  activityScoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  notesContainer: {
    flex: 1,
  },
  notesList: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  noteCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Colors.cardShadow as any,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.gray900,
    flex: 1,
  },
  noteContent: {
    fontSize: 14,
    color: Colors.gray600,
    lineHeight: 22,
    marginBottom: 15,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chapterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  noteDate: {
    fontSize: 12,
    color: Colors.gray400,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray900,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray500,
    marginTop: 8,
  },
  addNoteButton: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    ...Colors.cardShadow as any,
  },
  addNoteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    gap: 10,
  },
  addNoteButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.gray900,
  },
  modalContent: {
    paddingHorizontal: Spacing.xl,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray900,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: Colors.gray900,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contentInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  chapterSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  chapterOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  chapterOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF',
  },
  chapterOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray500,
  },
  chapterOptionTextActive: {
    color: Colors.primary,
  },
  saveButton: {
    paddingHorizontal: Spacing.xl,
    marginTop: 10,
  },
  saveGradient: {
    height: 56,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
