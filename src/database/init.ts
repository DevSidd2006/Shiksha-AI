import * as SQLite from 'expo-sqlite';

// Initialize database
const db = SQLite.openDatabaseSync('shiksha_ai.db');

export const initializeDatabase = async () => {
  try {
    // Create tables if they don't exist
    await db.execAsync(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        grade INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Chats table
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT,
        subject TEXT,
        messageCount INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      -- Messages table
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chatId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        modelUsed TEXT,
        tokens INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (chatId) REFERENCES chats(id)
      );

      -- Progress table
      CREATE TABLE IF NOT EXISTS progress (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        subject TEXT NOT NULL,
        questionsAsked INTEGER DEFAULT 0,
        correctAnswers INTEGER DEFAULT 0,
        accuracy REAL DEFAULT 0.0,
        timeSpent INTEGER DEFAULT 0,
        difficulty TEXT DEFAULT 'medium',
        streak INTEGER DEFAULT 0,
        lastAccessed DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        UNIQUE(userId, subject),
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      -- Achievements table
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        achievementType TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        target INTEGER DEFAULT 0,
        unlockedAt DATETIME,
        synced INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      -- Settings table
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        offlineMode INTEGER DEFAULT 1,
        dailyGoal INTEGER DEFAULT 5,
        soundEnabled INTEGER DEFAULT 1,
        notificationsEnabled INTEGER DEFAULT 1,
        selectedSubjects TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      -- Cached responses table (for offline)
      CREATE TABLE IF NOT EXISTS cached_responses (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        subject TEXT,
        modelUsed TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Sync queue table
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        record_id TEXT NOT NULL,
        payload TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_messages_chatId ON messages(chatId);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_progress_userId ON progress(userId);
      CREATE INDEX IF NOT EXISTS idx_progress_subject ON progress(subject);
      CREATE INDEX IF NOT EXISTS idx_achievements_userId ON achievements(userId);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_createdAt ON sync_queue(createdAt);
    `);

    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return false;
  }
};

export default db;
