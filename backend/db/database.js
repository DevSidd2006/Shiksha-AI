const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.BACKEND_DB_PATH || path.join(__dirname, 'shiksha_ai_backend.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`PRAGMA journal_mode = WAL;`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Student',
    grade TEXT DEFAULT 'Class 9',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tutor_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT 'General',
    question TEXT NOT NULL,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_tutor_events_user_id ON tutor_events(user_id);
  CREATE INDEX IF NOT EXISTS idx_tutor_events_created_at ON tutor_events(created_at);
`);

const ensureUserStmt = db.prepare(`
  INSERT OR IGNORE INTO users (id, name, grade) VALUES (?, ?, ?)
`);

const insertTutorEventStmt = db.prepare(`
  INSERT INTO tutor_events (id, user_id, subject, question, response_time_ms, created_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
`);

const totalStatsStmt = db.prepare(`
  SELECT
    COUNT(*) AS totalQuestions,
    COALESCE(SUM(response_time_ms), 0) AS totalTimeMs
  FROM tutor_events
  WHERE user_id = ?
`);

const todayStatsStmt = db.prepare(`
  SELECT
    COUNT(*) AS todayQuestions,
    COALESCE(SUM(response_time_ms), 0) AS todayTimeMs
  FROM tutor_events
  WHERE user_id = ? AND date(created_at) = date('now')
`);

const subjectStatsStmt = db.prepare(`
  SELECT
    subject,
    COUNT(*) AS questions
  FROM tutor_events
  WHERE user_id = ?
  GROUP BY subject
  ORDER BY questions DESC
`);

const weeklyStatsStmt = db.prepare(`
  SELECT
    date(created_at) AS day,
    COUNT(*) AS count
  FROM tutor_events
  WHERE user_id = ? AND date(created_at) >= date('now', '-6 day')
  GROUP BY date(created_at)
  ORDER BY day ASC
`);

const streakDaysStmt = db.prepare(`
  SELECT DISTINCT date(created_at) AS day
  FROM tutor_events
  WHERE user_id = ?
  ORDER BY day DESC
`);

function ensureUser(userId, name = 'Student', grade = 'Class 9') {
  ensureUserStmt.run(userId, name, grade);
}

function recordTutorEvent({ userId = 'student_default', subject = 'General', question = '', responseTimeMs = 0 }) {
  ensureUser(userId);

  insertTutorEventStmt.run(
    `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    subject,
    question,
    Number.isFinite(responseTimeMs) ? Math.max(0, Math.round(responseTimeMs)) : 0
  );
}

function computeCurrentStreak(days) {
  if (!days.length) return 0;

  const daySet = new Set(days.map((row) => row.day));
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const isoDate = cursor.toISOString().slice(0, 10);
    if (!daySet.has(isoDate)) {
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        const yesterdayIso = cursor.toISOString().slice(0, 10);
        if (daySet.has(yesterdayIso)) {
          streak = 1;
          continue;
        }
      }
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getDashboardStats(userId = 'student_default') {
  ensureUser(userId);

  const totalStats = totalStatsStmt.get(userId);
  const todayStats = todayStatsStmt.get(userId);
  const subjectRows = subjectStatsStmt.all(userId);
  const weeklyRows = weeklyStatsStmt.all(userId);
  const streakDays = streakDaysStmt.all(userId);

  const totalQuestions = totalStats?.totalQuestions || 0;
  const totalTimeSeconds = Math.round((totalStats?.totalTimeMs || 0) / 1000);
  const todayQuestions = todayStats?.todayQuestions || 0;
  const todayTimeSeconds = Math.round((todayStats?.todayTimeMs || 0) / 1000);
  const streak = computeCurrentStreak(streakDays);

  const dailyGoal = 5;
  const accuracy = totalQuestions > 0 ? Math.min(100, Math.round((60 + Math.min(totalQuestions, 40)) * 10) / 10) : 0;
  const totalPoints = totalQuestions * 10 + streak * 20;

  const subjects = subjectRows.map((row) => ({
    subject: row.subject,
    questions: row.questions,
    accuracy,
    rating: Math.min(5, 2.5 + row.questions / 10),
    level: accuracy >= 85 ? 'strong' : accuracy >= 70 ? 'good' : accuracy >= 50 ? 'fair' : 'needsWork',
  }));

  const last7 = [];
  const weekMap = new Map(weeklyRows.map((r) => [r.day, r.count]));
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const iso = date.toISOString().slice(0, 10);
    last7.push({
      day: dayNames[date.getDay()],
      count: weekMap.get(iso) || 0,
    });
  }

  const best = last7.reduce((acc, row) => (row.count > acc.count ? row : acc), last7[0] || { day: 'Mon', count: 0 });

  return {
    totalQuestions,
    totalTime: totalTimeSeconds,
    todayQuestions,
    todayTime: todayTimeSeconds,
    currentStreak: streak,
    streak,
    totalPoints,
    rank: totalPoints >= 3000 ? 3 : totalPoints >= 1500 ? 8 : totalPoints >= 800 ? 15 : totalPoints >= 300 ? 30 : 75,
    dailyGoal,
    accuracy,
    subjects,
    weeklyData: {
      totalQuestions: last7.reduce((sum, row) => sum + row.count, 0),
      totalTime: todayTimeSeconds,
      questionsPerDay: last7,
      accuracyTrend: last7.map((row) => ({ day: row.day, accuracy: row.count > 0 ? accuracy : 0 })),
      bestDay: best.day,
    },
    achievements: [],
    topics: subjects.slice(0, 5).map((subject) => ({
      topic: subject.subject,
      questions: subject.questions,
      accuracy: subject.accuracy,
      subtopics: ['Practice', 'Revision'],
    })),
  };
}

function getDatabaseHealth() {
  const result = db.prepare('SELECT 1 as ok').get();
  return result?.ok === 1;
}

module.exports = {
  ensureUser,
  recordTutorEvent,
  getDashboardStats,
  getDatabaseHealth,
};
