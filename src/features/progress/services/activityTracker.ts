import { db } from '@/core';

// Event types for real-time updates
export type ActivityEventType =
  | 'question_asked'
  | 'quiz_completed'
  | 'flashcard_mastered'
  | 'achievement_unlocked'
  | 'streak_updated'
  | 'points_earned';

export interface ActivityEvent {
  type: ActivityEventType;
  data: any;
  timestamp: Date;
}

// Listeners for activity updates
type ActivityListener = (event: ActivityEvent) => void;
const listeners: Set<ActivityListener> = new Set();

// Subscribe to activity updates
export function subscribeToActivity(listener: ActivityListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Emit an activity event
export function emitActivity(event: ActivityEvent): void {
  // Notify all listeners
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error('Activity listener error:', error);
    }
  });
}

// Record a question was asked (updates dashboard in real-time)
export async function recordQuestionAsked(subject: string): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update or insert progress for subject
    const existing = await db.getFirstAsync<{ id: string; questionsAsked: number }>(
      `SELECT id, questionsAsked FROM progress WHERE userId = ? AND subject = ?`,
      ['student_default', subject]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE progress SET questionsAsked = questionsAsked + 1, lastAccessed = datetime('now') WHERE id = ?`,
        [existing.id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO progress (id, userId, subject, questionsAsked, lastAccessed) VALUES (?, ?, ?, 1, datetime('now'))`,
        [`prog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 'student_default', subject]
      );
    }

    emitActivity({
      type: 'question_asked',
      data: { subject },
      timestamp: new Date(),
    });

    // Check for achievements after each question
    await checkAndUnlockAchievements();
  } catch (error) {
    console.error('Error recording question:', error);
  }
}

// Record quiz completion
export async function recordQuizCompletion(
  subject: string,
  score: number,
  totalQuestions: number
): Promise<void> {
  try {
    const accuracy = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    const points = score * 10 + Math.round(accuracy);

    const existing = await db.getFirstAsync<{ id: string; correctAnswers: number }>(
      `SELECT id, correctAnswers FROM progress WHERE userId = ? AND subject = ?`,
      ['student_default', subject]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE progress SET
          correctAnswers = correctAnswers + ?,
          accuracy = CASE
            WHEN questionsAsked > 0 THEN (correctAnswers + ?) * 100.0 / questionsAsked
            ELSE 0
          END,
          lastAccessed = datetime('now')
        WHERE id = ?`,
        [score, score, existing.id]
      );
    }

    emitActivity({
      type: 'quiz_completed',
      data: { subject, score, totalQuestions, accuracy, points },
      timestamp: new Date(),
    });

    await checkAndUnlockAchievements();
  } catch (error) {
    console.error('Error recording quiz:', error);
  }
}

// Save flashcard progress
export async function saveFlashcardProgress(
  cardId: string,
  status: 'mastered' | 'review' | 'new'
): Promise<void> {
  try {
    const now = new Date().toISOString();

    // Use app_meta to store flashcard progress as JSON
    const existing = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_meta WHERE key = 'flashcard_progress'`
    );

    let progress: Record<string, string> = {};
    if (existing?.value) {
      try {
        progress = JSON.parse(existing.value);
      } catch {}
    }

    progress[cardId] = status;

    await db.runAsync(
      `INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`,
      ['flashcard_progress', JSON.stringify(progress)]
    );

    if (status === 'mastered') {
      emitActivity({
        type: 'flashcard_mastered',
        data: { cardId },
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error('Error saving flashcard progress:', error);
  }
}

// Get flashcard progress
export async function getFlashcardProgress(): Promise<Record<string, string>> {
  try {
    const existing = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_meta WHERE key = 'flashcard_progress'`
    );

    if (existing?.value) {
      return JSON.parse(existing.value);
    }
  } catch (error) {
    console.error('Error getting flashcard progress:', error);
  }
  return {};
}

// Check and unlock achievements
async function checkAndUnlockAchievements(): Promise<void> {
  try {
    const userId = 'student_default';

    // Get current progress stats
    const totalQuestions = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages WHERE role = 'user'`
    );

    const mathQuestions = await db.getFirstAsync<{ count: number }>(
      `SELECT COALESCE(SUM(questionsAsked), 0) as count FROM progress WHERE userId = ? AND subject = 'Mathematics'`,
      [userId]
    );

    const scienceQuestions = await db.getFirstAsync<{ count: number }>(
      `SELECT COALESCE(SUM(questionsAsked), 0) as count FROM progress WHERE userId = ? AND subject = 'Science'`,
      [userId]
    );

    const timeResult = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(timeSpent), 0) as total FROM progress WHERE userId = ?`,
      [userId]
    );

    const achievements = [
      {
        type: 'curious_mind',
        target: 25,
        condition: (stats: any) => stats.totalQuestions >= 25,
      },
      {
        type: 'math_whiz',
        target: 15,
        condition: (stats: any) => stats.mathQuestions >= 15,
      },
      {
        type: 'science_explorer',
        target: 10,
        condition: (stats: any) => stats.scienceQuestions >= 10,
      },
      {
        type: 'time_traveler',
        target: 100,
        condition: (stats: any) => (stats.timeSpent || 0) >= 100,
      },
      {
        type: 'persistence_king',
        target: 50,
        condition: (stats: any) => stats.totalQuestions >= 50,
      },
    ];

    const stats = {
      totalQuestions: totalQuestions?.count || 0,
      mathQuestions: mathQuestions?.count || 0,
      scienceQuestions: scienceQuestions?.count || 0,
      timeSpent: timeResult?.total || 0,
    };

    for (const ach of achievements) {
      const existing = await db.getFirstAsync<{ id: string; unlockedAt: string }>(
        `SELECT id, unlockedAt FROM achievements WHERE userId = ? AND achievementType = ?`,
        [userId, ach.type]
      );

      if (!existing?.unlockedAt && ach.condition(stats)) {
        await db.runAsync(
          `INSERT OR REPLACE INTO achievements (id, userId, achievementType, progress, target, unlockedAt)
           VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [
            `ach_${ach.type}_${Date.now()}`,
            userId,
            ach.type,
            stats.totalQuestions,
            ach.target,
          ]
        );

        emitActivity({
          type: 'achievement_unlocked',
          data: { type: ach.type },
          timestamp: new Date(),
        });
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

// Get total points
export async function getTotalPoints(): Promise<number> {
  try {
    const totalQuestions = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages WHERE role = 'user'`
    );

    const accuracyResult = await db.getFirstAsync<{ avg: number }>(
      `SELECT COALESCE(AVG(accuracy), 0) as avg FROM progress WHERE userId = ?`,
      ['student_default']
    );

    const streakResult = await db.getFirstAsync<{ maxStreak: number }>(
      `SELECT COALESCE(MAX(streak), 0) as maxStreak FROM progress WHERE userId = ?`,
      ['student_default']
    );

    const questions = totalQuestions?.count || 0;
    const accuracy = accuracyResult?.avg || 0;
    const streak = streakResult?.maxStreak || 0;

    return Math.round(questions * 10 + accuracy * 5 + streak * 20);
  } catch (error) {
    console.error('Error getting total points:', error);
    return 0;
  }
}