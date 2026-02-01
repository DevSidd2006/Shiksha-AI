import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@shiksha_student_profile';

export interface StudentProfile {
  id: string;
  name: string;
  grade: string; // Class 5-9
  age: number;
  school?: string;
  email?: string;
  favoriteSubjects: string[]; // Math, Science, English, etc.
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  weeklyGoal: number; // Minutes per week
  avatar: string; // Emoji or name
  joinDate: Date;
  bio?: string;
  badges: string[]; // Achievement badges
  statistics: {
    totalChatsCompleted: number;
    totalTimeSpent: number; // minutes
    averageSessionLength: number; // minutes
    longestStreak: number; // days
    currentStreak: number; // days
    lastActiveDate: Date;
  };
}

// Default profile for new users
const DEFAULT_PROFILE: StudentProfile = {
  id: Date.now().toString(),
  name: 'Student',
  grade: 'Class 5-9',
  age: 12,
  school: '',
  email: '',
  favoriteSubjects: ['Math', 'Science'],
  learningStyle: 'visual',
  weeklyGoal: 300, // 5 hours per week
  avatar: '👨‍🎓',
  joinDate: new Date(),
  bio: 'Learning with Shiksha AI',
  badges: [],
  statistics: {
    totalChatsCompleted: 0,
    totalTimeSpent: 0,
    averageSessionLength: 0,
    longestStreak: 0,
    currentStreak: 0,
    lastActiveDate: new Date(),
  },
};

/**
 * Get student profile
 * Returns default profile if none exists
 */
export async function getProfile(): Promise<StudentProfile> {
  try {
    const profileJson = await AsyncStorage.getItem(PROFILE_KEY);
    if (profileJson) {
      const profile = JSON.parse(profileJson);
      // Convert date strings back to Date objects
      profile.joinDate = new Date(profile.joinDate);
      profile.statistics.lastActiveDate = new Date(
        profile.statistics.lastActiveDate
      );
      return profile;
    }
    // First time user - create default profile
    await saveProfile(DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  } catch (error) {
    console.error('Error getting profile:', error);
    return DEFAULT_PROFILE;
  }
}

/**
 * Update student profile
 */
export async function updateProfile(
  updates: Partial<StudentProfile>
): Promise<StudentProfile> {
  try {
    const currentProfile = await getProfile();
    const updatedProfile: StudentProfile = {
      ...currentProfile,
      ...updates,
      id: currentProfile.id, // Keep original ID
      joinDate: currentProfile.joinDate, // Keep original join date
    };

    await saveProfile(updatedProfile);
    return updatedProfile;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Save profile
 */
async function saveProfile(profile: StudentProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
}

/**
 * Update profile statistics after chat
 */
export async function updateChatStatistics(
  chatDurationMinutes: number
): Promise<void> {
  try {
    const profile = await getProfile();

    // Update statistics
    profile.statistics.totalChatsCompleted += 1;
    profile.statistics.totalTimeSpent += chatDurationMinutes;
    profile.statistics.averageSessionLength = Math.round(
      profile.statistics.totalTimeSpent / profile.statistics.totalChatsCompleted
    );
    profile.statistics.lastActiveDate = new Date();

    // Update streak
    const today = new Date();
    const lastActive = new Date(profile.statistics.lastActiveDate);
    const dayDifference = Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDifference === 0) {
      // Same day - continue streak
      // Already updated above
    } else if (dayDifference === 1) {
      // Next day - continue streak
      profile.statistics.currentStreak += 1;
      if (profile.statistics.currentStreak > profile.statistics.longestStreak) {
        profile.statistics.longestStreak = profile.statistics.currentStreak;
      }
    } else if (dayDifference > 1) {
      // Streak broken - reset
      profile.statistics.currentStreak = 1;
    }

    await updateProfile(profile);
  } catch (error) {
    console.error('Error updating chat statistics:', error);
  }
}

/**
 * Add badge to profile
 */
export async function addBadge(badge: string): Promise<void> {
  try {
    const profile = await getProfile();
    if (!profile.badges.includes(badge)) {
      profile.badges.push(badge);
      await updateProfile(profile);
    }
  } catch (error) {
    console.error('Error adding badge:', error);
  }
}

/**
 * Update favorite subjects
 */
export async function updateFavoriteSubjects(
  subjects: string[]
): Promise<void> {
  try {
    const profile = await getProfile();
    profile.favoriteSubjects = subjects;
    await updateProfile(profile);
  } catch (error) {
    console.error('Error updating favorite subjects:', error);
    throw error;
  }
}

/**
 * Update learning style preference
 */
export async function updateLearningStyle(
  style: 'visual' | 'auditory' | 'reading' | 'kinesthetic'
): Promise<void> {
  try {
    const profile = await getProfile();
    profile.learningStyle = style;
    await updateProfile(profile);
  } catch (error) {
    console.error('Error updating learning style:', error);
    throw error;
  }
}

/**
 * Update weekly goal
 */
export async function updateWeeklyGoal(minutes: number): Promise<void> {
  try {
    const profile = await getProfile();
    profile.weeklyGoal = minutes;
    await updateProfile(profile);
  } catch (error) {
    console.error('Error updating weekly goal:', error);
    throw error;
  }
}

/**
 * Reset profile to default
 */
export async function resetProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROFILE_KEY);
    await saveProfile(DEFAULT_PROFILE);
  } catch (error) {
    console.error('Error resetting profile:', error);
    throw error;
  }
}

/**
 * Delete profile (for data privacy)
 */
export async function deleteProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROFILE_KEY);
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
}

/**
 * Get profile summary for display
 */
export async function getProfileSummary(): Promise<{
  name: string;
  grade: string;
  avatar: string;
  chatsCompleted: number;
  totalTime: string;
  currentStreak: number;
}> {
  try {
    const profile = await getProfile();
    const hours = Math.floor(profile.statistics.totalTimeSpent / 60);
    const minutes = profile.statistics.totalTimeSpent % 60;

    return {
      name: profile.name,
      grade: profile.grade,
      avatar: profile.avatar,
      chatsCompleted: profile.statistics.totalChatsCompleted,
      totalTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      currentStreak: profile.statistics.currentStreak,
    };
  } catch (error) {
    console.error('Error getting profile summary:', error);
    throw error;
  }
}
