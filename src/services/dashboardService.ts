import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('shiksha_ai.db');

export interface DashboardStats {
  totalQuestions: number;
  totalTime: number;
  todayQuestions: number;
  todayTime: number;
  currentStreak: number;
  dailyGoal: number;
  accuracy: number;
  subjects: SubjectStats[];
  weeklyData: WeeklyStats;
  achievements: AchievementData[];
  topics: TopicData[];
}

export interface SubjectStats {
  subject: string;
  questions: number;
  accuracy: number;
  rating: number;
  level: 'strong' | 'good' | 'fair' | 'needsWork';
}

export interface WeeklyStats {
  totalQuestions: number;
  totalTime: number;
  questionsPerDay: { day: string; count: number }[];
  accuracyTrend: { day: string; accuracy: number }[];
  bestDay: string;
}

export interface AchievementData {
  id: string;
  type: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  target: number;
  icon: string;
}

export interface TopicData {
  topic: string;
  questions: number;
  accuracy: number;
  subtopics: string[];
}

export class DashboardService {
  // Get all dashboard statistics
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      // Total questions
      const totalQuestionsResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages WHERE role = 'user'`
      );
      const totalQuestions = totalQuestionsResult?.count || 0;

      // Today's questions
      const todayQuestionsResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages 
         WHERE role = 'user' AND datetime(timestamp) >= datetime(?)`,
        [todayStart]
      );
      const todayQuestions = todayQuestionsResult?.count || 0;

      // Total time spent
      const totalTimeResult = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(timeSpent), 0) as total FROM progress WHERE userId = ?`,
        [userId]
      );
      const totalTime = totalTimeResult?.total || 0;

      // Today's time
      const todayTimeResult = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(timeSpent), 0) as total FROM progress 
         WHERE userId = ? AND datetime(updatedAt) >= datetime(?)`,
        [userId, todayStart]
      );
      const todayTime = todayTimeResult?.total || 0;

      // Current streak
      const streakResult = await db.getFirstAsync<{ streak: number }>(
        `SELECT COALESCE(MAX(streak), 0) as streak FROM progress WHERE userId = ?`,
        [userId]
      );
      const currentStreak = streakResult?.streak || 0;

      // Overall accuracy
      const accuracyResult = await db.getFirstAsync<{ accuracy: number }>(
        `SELECT COALESCE(AVG(accuracy), 0) as accuracy FROM progress WHERE userId = ?`,
        [userId]
      );
      const accuracy = Math.round((accuracyResult?.accuracy || 0) * 10) / 10;

      // Daily goal (default 5)
      const dailyGoal = 5;

      // Subject statistics
      const subjects = await this.getSubjectStats(userId);

      // Weekly data
      const weeklyData = await this.getWeeklyStats(userId);

      // Achievements
      const achievements = await this.getAchievementData(userId);

      // Topics
      const topics = await this.getTopicData(userId);

      return {
        totalQuestions,
        totalTime,
        todayQuestions,
        todayTime,
        currentStreak,
        dailyGoal,
        accuracy,
        subjects,
        weeklyData,
        achievements,
        topics,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // Get subject-wise statistics
  static async getSubjectStats(userId: string): Promise<SubjectStats[]> {
    try {
      const results = await db.getAllAsync<{
        subject: string;
        questions: number;
        accuracy: number;
      }>(
        `SELECT subject, questionsAsked as questions, accuracy 
         FROM progress WHERE userId = ? ORDER BY questionsAsked DESC`,
        [userId]
      );

      return results.map((row) => ({
        subject: row.subject,
        questions: row.questions,
        accuracy: Math.round(row.accuracy * 10) / 10,
        rating: this.calculateRating(row.accuracy, row.questions),
        level: this.getPerformanceLevel(row.accuracy),
      }));
    } catch (error) {
      console.error('Error getting subject stats:', error);
      return [];
    }
  }

  // Get weekly statistics
  static async getWeeklyStats(userId: string): Promise<WeeklyStats> {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Weekly questions
      const weeklyQuestionsResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages 
         WHERE role = 'user' AND datetime(timestamp) >= datetime(?)`,
        [weekAgo.toISOString()]
      );
      const totalQuestions = weeklyQuestionsResult?.count || 0;

      // Weekly time
      const weeklyTimeResult = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(timeSpent), 0) as total FROM progress 
         WHERE userId = ? AND datetime(updatedAt) >= datetime(?)`,
        [userId, weekAgo.toISOString()]
      );
      const totalTime = weeklyTimeResult?.total || 0;

      // Questions per day
      const questionsPerDay = await this.getQuestionsPerDay(userId, 7);

      // Accuracy trend
      const accuracyTrend = await this.getAccuracyTrend(userId, 7);

      // Best day
      let bestDay = 'Monday';
      if (questionsPerDay.length > 0) {
        bestDay = questionsPerDay.reduce((prev, curr) =>
          curr.count > prev.count ? curr : prev
        ).day;
      }

      return {
        totalQuestions,
        totalTime,
        questionsPerDay,
        accuracyTrend,
        bestDay,
      };
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return {
        totalQuestions: 0,
        totalTime: 0,
        questionsPerDay: [],
        accuracyTrend: [],
        bestDay: 'Monday',
      };
    }
  }

  // Get achievement data
  static async getAchievementData(userId: string): Promise<AchievementData[]> {
    try {
      const achievements = await db.getAllAsync<{
        id: string;
        achievementType: string;
        progress: number;
        target: number;
        unlockedAt: string | null;
      }>(
        `SELECT id, achievementType, progress, target, unlockedAt 
         FROM achievements WHERE userId = ? ORDER BY unlockedAt DESC`,
        [userId]
      );

      const achievementDefs = this.getAchievementDefinitions();

      return achievements.map((ach) => {
        const def = achievementDefs[ach.achievementType] || {
          name: ach.achievementType,
          description: 'Unknown achievement',
          icon: '🏆',
        };

        return {
          id: ach.id,
          type: ach.achievementType,
          name: def.name,
          description: def.description,
          unlocked: !!ach.unlockedAt,
          unlockedAt: ach.unlockedAt ? new Date(ach.unlockedAt) : undefined,
          progress: ach.progress,
          target: ach.target,
          icon: def.icon,
        };
      });
    } catch (error) {
      console.error('Error getting achievement data:', error);
      return [];
    }
  }

  // Get topic data
  static async getTopicData(userId: string): Promise<TopicData[]> {
    try {
      // This is a simplified version - in production you'd track topics in the DB
      const results = await db.getAllAsync<{
        subject: string;
        questions: number;
        accuracy: number;
      }>(
        `SELECT subject, questionsAsked as questions, accuracy 
         FROM progress WHERE userId = ? ORDER BY questionsAsked DESC LIMIT 5`,
        [userId]
      );

      return results.map((row) => ({
        topic: row.subject,
        questions: row.questions,
        accuracy: Math.round(row.accuracy * 10) / 10,
        subtopics: this.getSubtopics(row.subject),
      }));
    } catch (error) {
      console.error('Error getting topic data:', error);
      return [];
    }
  }

  // Helper methods

  private static calculateRating(accuracy: number, questions: number): number {
    const baseRating = (accuracy / 100) * 5;
    const volumeBonus = Math.min(questions / 20, 1) * 0.5;
    return Math.min(5, baseRating + volumeBonus);
  }

  private static getPerformanceLevel(
    accuracy: number
  ): 'strong' | 'good' | 'fair' | 'needsWork' {
    if (accuracy >= 85) return 'strong';
    if (accuracy >= 70) return 'good';
    if (accuracy >= 50) return 'fair';
    return 'needsWork';
  }

  private static async getQuestionsPerDay(
    userId: string,
    days: number
  ): Promise<{ day: string; count: number }[]> {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { day: string; count: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM messages 
         WHERE role = 'user' AND datetime(timestamp) >= datetime(?) 
         AND datetime(timestamp) < datetime(?)`,
        [date.toISOString(), nextDate.toISOString()]
      );

      result.unshift({
        day: dayNames[date.getDay()],
        count: dayResult?.count || 0,
      });
    }

    return result;
  }

  private static async getAccuracyTrend(
    userId: string,
    days: number
  ): Promise<{ day: string; accuracy: number }[]> {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { day: string; accuracy: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = dayNames[date.getDay()];

      // For now, return average accuracy (simplified)
      const accResult = await db.getFirstAsync<{ accuracy: number }>(
        `SELECT COALESCE(AVG(accuracy), 0) as accuracy FROM progress WHERE userId = ?`,
        [userId]
      );

      result.unshift({
        day: dayStr,
        accuracy: Math.round((accResult?.accuracy || 0) * 10) / 10,
      });
    }

    return result;
  }

  private static getAchievementDefinitions(): Record<
    string,
    { name: string; description: string; icon: string }
  > {
    return {
      curious_mind: {
        name: 'Curious Mind',
        description: 'Asked 25 questions',
        icon: '🧠',
      },
      math_whiz: {
        name: 'Math Whiz',
        description: '15 math questions answered',
        icon: '📐',
      },
      science_explorer: {
        name: 'Science Explorer',
        description: '10 science questions answered',
        icon: '🔬',
      },
      time_traveler: {
        name: 'Time Traveler',
        description: 'Studied 100+ minutes',
        icon: '⏰',
      },
      perfect_day: {
        name: 'Perfect Day',
        description: '100% accuracy once',
        icon: '⭐',
      },
      knowledge_seeker: {
        name: 'Knowledge Seeker',
        description: 'Questions in 3+ subjects',
        icon: '📚',
      },
      rising_star: {
        name: 'Rising Star',
        description: '5-day learning streak',
        icon: '🚀',
      },
      persistence_king: {
        name: 'Persistence King',
        description: 'Asked 50 questions',
        icon: '💪',
      },
    };
  }

  private static getSubtopics(subject: string): string[] {
    const subtopics: Record<string, string[]> = {
      Mathematics: ['Algebra', 'Geometry', 'Arithmetic', 'Decimals'],
      Science: ['Physics', 'Chemistry', 'Biology', 'Earth Science'],
      English: ['Grammar', 'Reading', 'Writing', 'Vocabulary'],
      'Social Studies': ['History', 'Geography', 'Civics', 'Economics'],
      Hindi: ['Grammar', 'Literature', 'Writing', 'Comprehension'],
    };

    return subtopics[subject] || ['General'];
  }
}
