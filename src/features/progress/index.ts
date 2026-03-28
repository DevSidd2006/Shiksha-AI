export {
  DashboardService,
  type DashboardStats,
  type SubjectStats,
  type WeeklyStats,
  type AchievementData,
  type TopicData,
} from './services/dashboardService';
export { AchievementService, type AchievementDefinition } from './services/achievementService';
export {
  subscribeToActivity,
  emitActivity,
  recordQuestionAsked,
  recordQuizCompletion,
  saveFlashcardProgress,
  getFlashcardProgress,
  getTotalPoints,
  type ActivityEvent,
  type ActivityEventType,
} from './services/activityTracker';

