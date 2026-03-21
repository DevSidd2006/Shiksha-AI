import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAllChats, getFullChat, deleteChat } from '@/features/chat';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/shared';

interface ChatHistory {
  id: string;
  firstMessage: string;
  timestamp: Date;
  messageCount: number;
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

export default function HistoryScreen() {
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const allChats = await getAllChats();
      setChats(allChats || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleChatPress = async (chat: ChatHistory) => {
    const fullChat = await getFullChat(chat.id);
    if (fullChat) {
      setSelectedChat(fullChat);
      setModalVisible(true);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    Alert.alert('Delete Chat', 'Are you sure you want to delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteChat(chatId);
          loadHistory();
        },
      },
    ]);
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return d.toLocaleDateString();
    }
  };

  const renderChatItem = ({ item }: { item: ChatHistory }) => (
    <TouchableOpacity style={styles.chatCard} onPress={() => handleChatPress(item)} activeOpacity={0.7}>
      <View style={styles.chatIconBg}>
        <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.accent} />
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatSnippet} numberOfLines={1}>
          {item.firstMessage || 'New Conversation'}
        </Text>
        <View style={styles.chatMeta}>
          <Text style={styles.chatDate}>{formatDate(item.timestamp)}</Text>
          <View style={styles.dot} />
          <Text style={styles.messageCount}>{item.messageCount || 0} messages</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleDeleteChat(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient colors={theme.headerGradient as any} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandWrap}>
            <View style={styles.brandIcon}>
              <Ionicons name="time-outline" size={15} color={theme.accent} />
            </View>
            <Text style={styles.brandText}>History</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={theme.text} />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={theme.cardGradient as any} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Learning History</Text>
          <Text style={styles.heroSubtitle}>Review your previous conversations and revisions.</Text>
        </LinearGradient>
      </LinearGradient>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySubtitle}>Your AI Tutor conversations will appear here.</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => router.push('/(tabs)/tutor')}>
            <Text style={styles.startBtnText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={chats} renderItem={renderChatItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.listContent} />
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.iconBtn}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Conversation</Text>
            <View style={{ width: 34 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {selectedChat?.messages && selectedChat.messages.length > 0 ? (
              selectedChat.messages.map((msg: any, index: number) => (
                <View key={index} style={[styles.msgBubble, msg.isUser ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.msgText, msg.isUser ? styles.userMsgText : styles.aiMsgText]}>{msg.text}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No messages in this conversation</Text>
            )}
          </ScrollView>
        </SafeAreaView>
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
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
    },
    chatCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      padding: 12,
      borderRadius: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chatIconBg: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      backgroundColor: theme.chipBg,
    },
    chatInfo: {
      flex: 1,
    },
    chatSnippet: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    chatMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chatDate: {
      fontSize: 12,
      color: theme.textMuted,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.textMuted,
      marginHorizontal: 8,
      opacity: 0.6,
    },
    messageCount: {
      fontSize: 12,
      color: theme.textMuted,
    },
    deleteBtn: {
      padding: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      marginTop: 8,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    startBtn: {
      marginTop: 14,
      backgroundColor: theme.accent,
      paddingHorizontal: 20,
      paddingVertical: 11,
      borderRadius: 999,
    },
    startBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.panel,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    modalScroll: {
      padding: 16,
    },
    msgBubble: {
      padding: 12,
      borderRadius: 14,
      marginBottom: 10,
      maxWidth: '86%',
      borderWidth: 1,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: '#1F3B75',
      borderColor: 'rgba(59,130,246,0.45)',
      borderBottomRightRadius: 4,
    },
    aiBubble: {
      alignSelf: 'flex-start',
      backgroundColor: theme.panel,
      borderColor: theme.border,
      borderBottomLeftRadius: 4,
    },
    msgText: {
      fontSize: 14,
      lineHeight: 21,
    },
    userMsgText: {
      color: '#FFFFFF',
    },
    aiMsgText: {
      color: theme.text,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 40,
      fontWeight: '500',
    },
  });
