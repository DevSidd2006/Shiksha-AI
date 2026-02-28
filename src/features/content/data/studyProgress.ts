export interface StudySession {
  id: string;
  chapterId: number;
  type: 'flashcard' | 'quiz';
  startTime: Date;
  endTime: Date;
  score?: number;
  totalQuestions?: number;
}

export interface StudentNote {
  id: string;
  chapterId: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface StudyStats {
  totalSessions: number;
  totalTimeSpent: number;
  averageScore: number;
  chaptersCompleted: number;
  lastStudyDate: Date | null;
  streakDays: number;
}

export const calculateStudyStats = (sessions: StudySession[]): StudyStats => {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalTimeSpent: 0,
      averageScore: 0,
      chaptersCompleted: 0,
      lastStudyDate: null,
      streakDays: 0,
    };
  }

  const totalTimeSpent = sessions.reduce((acc, session) => {
    const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
    return acc + duration;
  }, 0);

  const quizSessions = sessions.filter(s => s.type === 'quiz' && s.score !== undefined);
  const averageScore = quizSessions.length > 0
    ? quizSessions.reduce((acc, s) => acc + (s.score || 0), 0) / quizSessions.length
    : 0;

  const uniqueChapters = new Set(sessions.map(s => s.chapterId));

  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
  );

  const lastStudyDate = sortedSessions.length > 0 ? new Date(sortedSessions[0].endTime) : null;

  // Calculate streak (consecutive days of study)
  let streakDays = 0;
  if (lastStudyDate) {
    const today = new Date();
    const lastStudy = new Date(lastStudyDate);
    const daysDiff = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      streakDays = 1;
      let currentDate = new Date(lastStudy);
      currentDate.setDate(currentDate.getDate() - 1);
      
      for (const session of sortedSessions) {
        const sessionDate = new Date(session.endTime);
        if (Math.abs(sessionDate.getTime() - currentDate.getTime()) < 1000 * 60 * 60 * 24) {
          streakDays++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  return {
    totalSessions: sessions.length,
    totalTimeSpent: Math.round(totalTimeSpent / 1000 / 60), // Convert to minutes
    averageScore: Math.round(averageScore * 10) / 10,
    chaptersCompleted: uniqueChapters.size,
    lastStudyDate,
    streakDays,
  };
};

export const formatTimeSpent = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const getMotivationalMessage = (stats: StudyStats): string => {
  if (stats.streakDays === 0) {
    return '🚀 Start your study journey today!';
  }
  if (stats.streakDays === 1) {
    return '🔥 Great start! Keep it up!';
  }
  if (stats.streakDays === 3) {
    return '💪 3-day streak! You\'re on fire!';
  }
  if (stats.streakDays === 7) {
    return '⭐ One week streak! Amazing dedication!';
  }
  if (stats.streakDays === 30) {
    return '🏆 30-day streak! You\'re a study champion!';
  }
  return `🎯 ${stats.streakDays}-day streak! Keep going!`;
};
