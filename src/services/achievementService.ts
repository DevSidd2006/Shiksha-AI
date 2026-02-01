import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('shiksha_ai.db');

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: any) => boolean;
  target: number;
  category: 'questions' | 'accuracy' | 'time' | 'streak' | 'subject';
}

export class AchievementService {
  // Check and unlock achievements
  static async checkAndUnlockAchievements(userId: string): Promise<string[]> {
    try {
      const unlocked: string[] = [];

      // Get current stats
      const totalQuestions = await this.getTotalQuestions(userId);
      const totalTime = await this.getTotalTime(userId);
      const currentStreak = await this.getCurrentStreak(userId);
      const subjects = await this.getSubjectsCount(userId);
      const maxAccuracy = await this.getMaxAccuracy(userId);

      const stats = {
        totalQuestions,
        totalTime,
        currentStreak,
        subjects,
        maxAccuracy,
      };

      const achievements = this.getAchievementDefinitions();

      for (const [key, achievement] of Object.entries(achievements)) {
        const isUnlocked = await this.isAchievementUnlocked(userId, key);

        if (!isUnlocked && achievement.condition(stats)) {
          await this.unlockAchievement(userId, key, achievement.target);
          unlocked.push(key);
        }
      }

      return unlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  // Unlock an achievement
  static async unlockAchievement(
    userId: string,
    achievementType: string,
    target: number = 0
  ): Promise<void> {
    try {
      const id = `ach_${userId}_${achievementType}_${Date.now()}`;

      await db.runAsync(
        `INSERT INTO achievements (id, userId, achievementType, progress, target, unlockedAt)
         VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT DO NOTHING`,
        [id, userId, achievementType, target, target]
      );

      console.log(`✅ Achievement unlocked: ${achievementType}`);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }

  // Check if achievement is already unlocked
  private static async isAchievementUnlocked(
    userId: string,
    achievementType: string
  ): Promise<boolean> {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM achievements 
         WHERE userId = ? AND achievementType = ? AND unlockedAt IS NOT NULL`,
        [userId, achievementType]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking achievement unlock status:', error);
      return false;
    }
  }

  // Get all achievement definitions
  private static getAchievementDefinitions(): Record<
    string,
    AchievementDefinition
  > {
    return {
      curious_mind: {
        id: 'curious_mind',
        name: 'Curious Mind',
        description: 'Asked 25 questions',
        icon: '🧠',
        condition: (stats) => stats.totalQuestions >= 25,
        target: 25,
        category: 'questions',
      },
      first_step: {
        id: 'first_step',
        name: 'First Step',
        description: 'Asked your first question',
        icon: '👣',
        condition: (stats) => stats.totalQuestions >= 1,
        target: 1,
        category: 'questions',
      },
      practice_buddy: {
        id: 'practice_buddy',
        name: 'Practice Buddy',
        description: 'Asked 5 questions',
        icon: '👥',
        condition: (stats) => stats.totalQuestions >= 5,
        target: 5,
        category: 'questions',
      },
      math_whiz: {
        id: 'math_whiz',
        name: 'Math Whiz',
        description: '15 math questions answered',
        icon: '📐',
        condition: (stats) => stats.totalQuestions >= 15, // Simplified
        target: 15,
        category: 'subject',
      },
      science_explorer: {
        id: 'science_explorer',
        name: 'Science Explorer',
        description: '10 science questions answered',
        icon: '🔬',
        condition: (stats) => stats.totalQuestions >= 10,
        target: 10,
        category: 'subject',
      },
      time_traveler: {
        id: 'time_traveler',
        name: 'Time Traveler',
        description: 'Studied 100+ minutes',
        icon: '⏰',
        condition: (stats) => stats.totalTime >= 6000, // 100 minutes in seconds
        target: 100,
        category: 'time',
      },
      perfect_day: {
        id: 'perfect_day',
        name: 'Perfect Day',
        description: '100% accuracy once',
        icon: '⭐',
        condition: (stats) => stats.maxAccuracy >= 100,
        target: 100,
        category: 'accuracy',
      },
      knowledge_seeker: {
        id: 'knowledge_seeker',
        name: 'Knowledge Seeker',
        description: 'Questions in 3+ subjects',
        icon: '📚',
        condition: (stats) => stats.subjects >= 3,
        target: 3,
        category: 'subject',
      },
      rising_star: {
        id: 'rising_star',
        name: 'Rising Star',
        description: '5-day learning streak',
        icon: '🚀',
        condition: (stats) => stats.currentStreak >= 5,
        target: 5,
        category: 'streak',
      },
      persistence_king: {
        id: 'persistence_king',
        name: 'Persistence King',
        description: 'Asked 50 questions',
        icon: '💪',
        condition: (stats) => stats.totalQuestions >= 50,
        target: 50,
        category: 'questions',
      },
      genius_level: {
        id: 'genius_level',
        name: 'Genius Level',
        description: '100 questions answered',
        icon: '🧙',
        condition: (stats) => stats.totalQuestions >= 100,
        target: 100,
        category: 'questions',
      },
      consistent_learner: {
        id: 'consistent_learner',
        name: 'Consistent Learner',
        description: '7-day learning streak',
        icon: '📊',
        condition: (stats) => stats.currentStreak >= 7,
        target: 7,
        category: 'streak',
      },
    };
  }

  // Helper methods to get stats
  private static async getTotalQuestions(userId: string): Promise<number> {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages WHERE role = 'user'`
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting total questions:', error);
      return 0;
    }
  }

  private static async getTotalTime(userId: string): Promise<number> {
    try {
      const result = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(timeSpent), 0) as total FROM progress WHERE userId = ?`,
        [userId]
      );
      return result?.total || 0;
    } catch (error) {
      console.error('Error getting total time:', error);
      return 0;
    }
  }

  private static async getCurrentStreak(userId: string): Promise<number> {
    try {
      const result = await db.getFirstAsync<{ streak: number }>(
        `SELECT COALESCE(MAX(streak), 0) as streak FROM progress WHERE userId = ?`,
        [userId]
      );
      return result?.streak || 0;
    } catch (error) {
      console.error('Error getting current streak:', error);
      return 0;
    }
  }

  private static async getSubjectsCount(userId: string): Promise<number> {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(DISTINCT subject) as count FROM progress WHERE userId = ?`,
        [userId]
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting subjects count:', error);
      return 0;
    }
  }

  private static async getMaxAccuracy(userId: string): Promise<number> {
    try {
      const result = await db.getFirstAsync<{ maxAcc: number }>(
        `SELECT COALESCE(MAX(accuracy), 0) as maxAcc FROM progress WHERE userId = ?`,
        [userId]
      );
      return result?.maxAcc || 0;
    } catch (error) {
      console.error('Error getting max accuracy:', error);
      return 0;
    }
  }
}
