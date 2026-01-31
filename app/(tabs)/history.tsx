import React, { useState } from 'react';
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
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAllChats, deleteAllChats, getFullChat, deleteChat } from '@/storage/chatStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Fonts, Shadows, Spacing, BorderRadius } from '@/styles/designSystem';

const { width } = Dimensions.get('window');

interface ChatHistory {
  id: string;
  firstMessage: string;
  timestamp: Date;
  messageCount: number;
}

const INDIGO_GRADIENT = ['#6366F1', '#4F46E5'];

export default function HistoryScreen() {
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
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteChat(chatId);
            loadHistory();
          },
        },
      ]
    );
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
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.chatIconContainer}>
        <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.chatIconBg}>
          <Ionicons name="chatbubble-ellipses" size={24} color={Colors.primary} />
        </LinearGradient>
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
        <Ionicons name="trash-outline" size={20} color={Colors.gray400} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={INDIGO_GRADIENT as any} style={styles.header}>
        <Text style={styles.headerTitle}>Learning History</Text>
        <Text style={styles.headerSubtitle}>Review your previous lessons</Text>
      </LinearGradient>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="history" size={60} color={Colors.gray200} />
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your conversations with the AI Tutor will appear here.
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.push('/(tabs)/tutor')}
          >
            <Text style={styles.startBtnText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Full Chat Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.gray700} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Conversation</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {selectedChat?.messages && selectedChat.messages.length > 0 ? (
              selectedChat.messages.map((msg: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.msgBubble,
                    msg.isUser ? styles.userBubble : styles.aiBubble
                  ]}
                >
                  <Text style={[styles.msgText, msg.isUser ? styles.userMsgText : styles.aiMsgText]}>
                    {msg.text}
                  </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    padding: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
  listContent: {
    padding: 20,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Shadows.sm,
  },
  chatIconContainer: {
    marginRight: 15,
  },
  chatIconBg: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
  },
  chatSnippet: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.gray900,
    marginBottom: 4,
  },
  chatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatDate: {
    fontSize: 12,
    color: Colors.gray500,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.gray300,
    marginHorizontal: 8,
  },
  messageCount: {
    fontSize: 12,
    color: Colors.gray500,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.gray800,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.gray500,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  startBtn: {
    marginTop: 30,
    backgroundColor: Colors.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  startBtnText: {
    color: Colors.white,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  closeBtn: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
  },
  modalScroll: {
    padding: 20,
  },
  msgBubble: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gray100,
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMsgText: {
    color: Colors.white,
  },
  aiMsgText: {
    color: Colors.gray800,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray500,
    textAlign: 'center',
    marginTop: 40,
    fontFamily: Fonts.regular,
  },
});
