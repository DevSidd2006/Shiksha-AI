import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_CHAT_KEY = '@shiksha_current_chat';
const CHAT_HISTORY_KEY = '@shiksha_chat_history';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Chat {
  id: string;
  messages: Message[];
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  firstMessage: string;
  timestamp: Date;
  messageCount: number;
}

// Save current chat session
export async function saveChat(messages: Message[]): Promise<void> {
  try {
    const chat: Chat = {
      id: Date.now().toString(),
      messages,
      timestamp: new Date(),
    };

    await AsyncStorage.setItem(CURRENT_CHAT_KEY, JSON.stringify(chat));

    // Also add to history if there are messages
    if (messages.length > 0) {
      await addToHistory(chat);
    }
  } catch (error) {
    console.error('Error saving chat:', error);
  }
}

// Get current chat session
export async function getCurrentChat(): Promise<Chat | null> {
  try {
    const chatJson = await AsyncStorage.getItem(CURRENT_CHAT_KEY);
    if (chatJson) {
      const chat = JSON.parse(chatJson);
      // Convert timestamp strings back to Date objects
      chat.timestamp = new Date(chat.timestamp);
      chat.messages = chat.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      return chat;
    }
    return null;
  } catch (error) {
    console.error('Error getting current chat:', error);
    return null;
  }
}

// Add chat to history
async function addToHistory(chat: Chat): Promise<void> {
  try {
    const historyJson = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    const history: Chat[] = historyJson ? JSON.parse(historyJson) : [];

    // Check if this chat is already in history (update it)
    const existingIndex = history.findIndex((h) => h.id === chat.id);
    if (existingIndex >= 0) {
      history[existingIndex] = chat;
    } else {
      history.unshift(chat); // Add to beginning
    }

    // Keep only last 50 chats
    const limitedHistory = history.slice(0, 50);

    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Error adding to history:', error);
  }
}

// Get all chat history
export async function getAllChats(): Promise<ChatHistory[]> {
  try {
    const historyJson = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (historyJson) {
      const history: Chat[] = JSON.parse(historyJson);
      
      // Convert to ChatHistory format
      return history.map((chat) => {
        const firstUserMessage = chat.messages.find((msg) => msg.isUser);
        return {
          id: chat.id,
          firstMessage: firstUserMessage?.text || 'Empty conversation',
          timestamp: new Date(chat.timestamp),
          messageCount: chat.messages.length,
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error getting all chats:', error);
    return [];
  }
}

// Delete all chats
export async function deleteAllChats(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([CURRENT_CHAT_KEY, CHAT_HISTORY_KEY]);
  } catch (error) {
    console.error('Error deleting all chats:', error);
  }
}

// Clear current chat (start new conversation)
export async function clearCurrentChat(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CURRENT_CHAT_KEY);
  } catch (error) {
    console.error('Error clearing current chat:', error);
  }
}

// Get full chat by ID
export async function getFullChat(chatId: string): Promise<Chat | null> {
  try {
    const historyJson = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (historyJson) {
      const history: Chat[] = JSON.parse(historyJson);
      const chat = history.find((c) => c.id === chatId);
      
      if (chat) {
        // Convert timestamp strings back to Date objects
        chat.timestamp = new Date(chat.timestamp);
        chat.messages = chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        return chat;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting full chat:', error);
    return null;
  }
}

// Delete a specific chat
export async function deleteChat(chatId: string): Promise<void> {
  try {
    const historyJson = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (historyJson) {
      const history: Chat[] = JSON.parse(historyJson);
      const filteredHistory = history.filter((c) => c.id !== chatId);
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(filteredHistory));
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
  }
}
