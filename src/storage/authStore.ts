import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@shiksha_auth';
const USERS_KEY = '@shiksha_users';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // In production, this should be hashed
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  isAuthenticated: boolean;
}

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Save user
const saveUser = async (user: User): Promise<void> => {
  try {
    const users = await getAllUsers();
    users.push(user);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// Register new user
export const registerUser = async (
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const users = await getAllUsers();
    
    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return { success: false, message: 'Email already registered' };
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}`,
      email: email.toLowerCase(),
      name,
      password, // In production, hash this
      createdAt: new Date().toISOString(),
    };

    await saveUser(newUser);
    return { success: true, message: 'Registration successful', user: newUser };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, message: 'Registration failed' };
  }
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const users = await getAllUsers();
    
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Save auth session
    const session: AuthSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      isAuthenticated: true,
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(session));

    return { success: true, message: 'Login successful', user };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, message: 'Login failed' };
  }
};

// Get current auth session
export const getAuthSession = async (): Promise<AuthSession | null> => {
  try {
    const sessionJson = await AsyncStorage.getItem(AUTH_KEY);
    return sessionJson ? JSON.parse(sessionJson) : null;
  } catch (error) {
    console.error('Error getting auth session:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getAuthSession();
  return session?.isAuthenticated || false;
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error('Error logging out:', error);
  }
};
