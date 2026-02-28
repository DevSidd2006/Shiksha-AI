import Constants from 'expo-constants';
import { Platform } from 'react-native';

// API service to communicate with backend
// Choose a base URL that works across Expo web, Android emulator, and devices on the same LAN.
const getDevBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
};

const API_URL = __DEV__ 
  ? getDevBaseUrl()
  : (process.env.EXPO_PUBLIC_API_URL || 'https://shikshaai-backend.vercel.app');

export interface TutorResponse {
  answer: string;
  timestamp: string;
  model?: string;
  source?: 'ollama';
}

export async function sendQuestion(
  question: string,
  studentGrade: string = 'Class 9'
): Promise<TutorResponse> {
  try {
    const response = await fetch(`${API_URL}/tutor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question,
        studentGrade,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to get response from tutor. Please check your connection.');
  }
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, targetLang }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.translation;
  } catch (error) {
    console.error('Translation API Error:', error);
    return text;
  }
}

export async function processDocument(
  text: string, 
  task: 'correct' | 'summarize' | 'qa' | 'extract' = 'correct',
  customPrompt?: string
): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/process-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, task, customPrompt }),
    });

    if (!response.ok) throw new Error('Failed to process document');
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Document Processing Error:', error);
    return text; // Fallback to raw text
  }
}
