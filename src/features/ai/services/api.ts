import Constants from 'expo-constants';
import { Platform } from 'react-native';

// API service to communicate with backend
// Choose a base URL that works across Expo web, Android emulator, and devices on the same LAN.
const getConfiguredBaseUrl = () => {
  const configuredUrl =
    Constants.expoConfig?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL;

  if (typeof configuredUrl === 'string' && configuredUrl.trim().length > 0) {
    return configuredUrl.replace(/\/+$/, '');
  }

  return null;
};

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

const getBaseUrlCandidates = (): string[] => {
  const hostUri = Constants.expoConfig?.hostUri;
  const hostFromExpo = hostUri ? `http://${hostUri.split(':')[0]}:3000` : null;

  const candidates = [
    getConfiguredBaseUrl(),
    hostFromExpo,
    Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000',
    'https://shikshaai-backend.vercel.app',
  ]
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    .map((url) => url.replace(/\/+$/, ''));

  return [...new Set(candidates)];
};

const API_BASE_CANDIDATES = getBaseUrlCandidates();
console.log('🔗 API URL candidates:', API_BASE_CANDIDATES.join(', '));

interface ApiFetchResult {
  response: Response;
  endpoint: string;
}

const fetchWithFallback = async (path: string, init: RequestInit): Promise<ApiFetchResult> => {
  let lastError: Error | null = null;

  for (const baseUrl of API_BASE_CANDIDATES) {
    const endpoint = `${baseUrl}${path}`;
    try {
      const response = await fetch(endpoint, init);
      if (response.ok) {
        return { response, endpoint };
      }

      let backendMessage = '';
      try {
        const errorData = await response.json();
        backendMessage = errorData?.error || errorData?.details || '';
      } catch {
        backendMessage = '';
      }

      const message = backendMessage
        ? `HTTP ${response.status}: ${backendMessage}`
        : `HTTP error! status: ${response.status}`;

      lastError = new Error(`${message} (endpoint: ${endpoint})`);

      // Continue trying alternatives for missing route or server-side failures.
      if (response.status === 404 || response.status >= 500) {
        continue;
      }

      throw lastError;
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed request to ${endpoint}`;
      lastError = new Error(message.includes('endpoint:') ? message : `${message} (endpoint: ${endpoint})`);
    }
  }

  throw (lastError || new Error('All API endpoints failed'));
};

export interface TutorResponse {
  answer: string;
  timestamp: string;
  model?: string;
  source?: 'ollama';
}

export async function sendQuestion(
  question: string,
  studentGrade: string = 'Class 9',
  userId: string = 'student_default',
  subject: string = 'General'
): Promise<TutorResponse> {
  try {
    const { response } = await fetchWithFallback('/tutor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question,
        studentGrade,
        userId,
        subject,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get response from tutor.';
    throw new Error(message);
  }
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    const { response } = await fetchWithFallback('/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, targetLang }),
    });

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
  const localOcrCleanup = (raw: string): string => {
    return raw
      .replace(/\s+/g, ' ')
      .replace(/[|]+/g, '')
      .replace(/_{3,}/g, '')
      .replace(/\.{3,}/g, '...')
      .replace(/\s+([?.!,;:])/g, '$1')
      .trim();
  };

  try {
    const { response } = await fetchWithFallback('/process-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, task, customPrompt }),
    });

    const data = await response.json();
    if (typeof data?.result === 'string' && data.result.trim().length > 0) {
      return data.result;
    }

    throw new Error('Failed to process document: empty result');
  } catch (error) {
    console.warn('Document Processing Error:', error);

    // Always return useful output so OCR "Fix + Insert" keeps working even when backend LLM is unavailable.
    if (task === 'correct') {
      return localOcrCleanup(text);
    }

    return text;
  }
}
