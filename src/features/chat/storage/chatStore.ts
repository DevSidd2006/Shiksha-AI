import { db } from '@/core';
import { SyncManager } from '@/core';

const DEFAULT_USER_ID = 'student_default';
const CURRENT_CHAT_KEY = 'current_chat_id';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  imageUri?: string;
  extractedText?: string;
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

const rowToMessage = (row: {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}) => ({
  id: row.id,
  text: row.content,
  isUser: row.role === 'user',
  timestamp: new Date(row.timestamp),
});

async function getCurrentChatId(): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = ?`,
    [CURRENT_CHAT_KEY]
  );
  return row?.value || null;
}

async function setCurrentChatId(chatId: string): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`,
    [CURRENT_CHAT_KEY, chatId]
  );
}

async function clearCurrentChatId(): Promise<void> {
  await db.runAsync(`DELETE FROM app_meta WHERE key = ?`, [CURRENT_CHAT_KEY]);
}

// Save current chat session
export async function saveChat(messages: Message[]): Promise<void> {
  try {
    if (messages.length === 0) return;

    let chatId = await getCurrentChatId();
    if (!chatId) {
      chatId = Date.now().toString();
      await db.runAsync(
        `INSERT INTO chats (id, userId, title, messageCount, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [chatId, DEFAULT_USER_ID, 'New Conversation', messages.length]
      );
      await setCurrentChatId(chatId);

      // Sync to cloud
      SyncManager.enqueueMutation('chats', 'INSERT', chatId, {
        id: chatId,
        user_id: DEFAULT_USER_ID,
        title: 'New Conversation',
        message_count: messages.length,
      });

    } else {
      await db.runAsync(`DELETE FROM messages WHERE chatId = ?`, [chatId]);
      await db.runAsync(
        `UPDATE chats SET messageCount = ?, updatedAt = datetime('now') WHERE id = ?`,
        [messages.length, chatId]
      );

      // We only enqueue an UPDATE if the user exists or if we care about messageCount syncing
      SyncManager.enqueueMutation('chats', 'UPDATE', chatId, {
        id: chatId,
        message_count: messages.length,
        updated_at: new Date().toISOString()
      });
    }

    for (const msg of messages) {
      const safeId = msg.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const timestampIso = new Date(msg.timestamp).toISOString();
      const role = msg.isUser ? 'user' : 'assistant';

      await db.runAsync(
        `INSERT OR REPLACE INTO messages (id, chatId, role, content, timestamp)
         VALUES (?, ?, ?, ?, ?)`,
        [safeId, chatId, role, msg.text, timestampIso]
      );

      // Sync message immediately
      SyncManager.enqueueMutation('messages', 'INSERT', safeId, {
        id: safeId,
        chat_id: chatId,
        role: role,
        content: msg.text,
        timestamp: timestampIso
      });
    }
  } catch (error) {
    console.error('Error saving chat:', error);
  }
}

// Get current chat session
export async function getCurrentChat(): Promise<Chat | null> {
  try {
    const chatId = await getCurrentChatId();
    if (!chatId) return null;

    const chatRow = await db.getFirstAsync<{ id: string; updatedAt: string }>(
      `SELECT id, updatedAt FROM chats WHERE id = ?`,
      [chatId]
    );
    if (!chatRow) return null;

    const rows = await db.getAllAsync<{
      id: string;
      role: string;
      content: string;
      timestamp: string;
    }>(
      `SELECT id, role, content, timestamp
       FROM messages
       WHERE chatId = ?
       ORDER BY datetime(timestamp) ASC`,
      [chatId]
    );

    return {
      id: chatId,
      messages: rows.map(rowToMessage),
      timestamp: new Date(chatRow.updatedAt),
    };
  } catch (error) {
    console.error('Error getting current chat:', error);
    return null;
  }
}

// Get all chat history
export async function getAllChats(): Promise<ChatHistory[]> {
  try {
    const chats = await db.getAllAsync<{
      id: string;
      updatedAt: string;
      messageCount: number;
    }>(
      `SELECT id, updatedAt, messageCount
       FROM chats
       ORDER BY datetime(updatedAt) DESC
       LIMIT 50`
    );

    const result: ChatHistory[] = [];

    for (const chat of chats) {
      const firstUserMessage = await db.getFirstAsync<{ content: string }>(
        `SELECT content
         FROM messages
         WHERE chatId = ? AND role = 'user'
         ORDER BY datetime(timestamp) ASC
         LIMIT 1`,
        [chat.id]
      );

      result.push({
        id: chat.id,
        firstMessage: firstUserMessage?.content || 'Empty conversation',
        timestamp: new Date(chat.updatedAt),
        messageCount: chat.messageCount || 0,
      });
    }

    return result;
  } catch (error) {
    console.error('Error getting all chats:', error);
    return [];
  }
}

// Delete all chats
export async function deleteAllChats(): Promise<void> {
  try {
    await db.runAsync(`DELETE FROM messages`);
    await db.runAsync(`DELETE FROM chats`);
    await clearCurrentChatId();
  } catch (error) {
    console.error('Error deleting all chats:', error);
  }
}

// Clear current chat (start new conversation)
export async function clearCurrentChat(): Promise<void> {
  try {
    await clearCurrentChatId();
  } catch (error) {
    console.error('Error clearing current chat:', error);
  }
}

// Get full chat by ID
export async function getFullChat(chatId: string): Promise<Chat | null> {
  try {
    const chat = await db.getFirstAsync<{ id: string; updatedAt: string }>(
      `SELECT id, updatedAt FROM chats WHERE id = ?`,
      [chatId]
    );
    if (!chat) return null;

    const rows = await db.getAllAsync<{
      id: string;
      role: string;
      content: string;
      timestamp: string;
    }>(
      `SELECT id, role, content, timestamp
       FROM messages
       WHERE chatId = ?
       ORDER BY datetime(timestamp) ASC`,
      [chatId]
    );

    return {
      id: chat.id,
      messages: rows.map(rowToMessage),
      timestamp: new Date(chat.updatedAt),
    };
  } catch (error) {
    console.error('Error getting full chat:', error);
    return null;
  }
}

// Delete a specific chat
export async function deleteChat(chatId: string): Promise<void> {
  try {
    await db.runAsync(`DELETE FROM messages WHERE chatId = ?`, [chatId]);
    await db.runAsync(`DELETE FROM chats WHERE id = ?`, [chatId]);

    const currentId = await getCurrentChatId();
    if (currentId === chatId) {
      await clearCurrentChatId();
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
  }
}
