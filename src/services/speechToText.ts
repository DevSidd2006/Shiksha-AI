import * as Speech from 'expo-speech';
import {
  Alert,
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';

export interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  error: string | null;
}

export const INDIAN_LANGUAGES = {
  HINDI: { code: 'hi-IN', name: 'हिंदी (Hindi)', nativeName: 'Hindi' },
  TAMIL: { code: 'ta-IN', name: 'தமிழ் (Tamil)', nativeName: 'Tamil' },
  TELUGU: { code: 'te-IN', name: 'తెలుగు (Telugu)', nativeName: 'Telugu' },
  KANNADA: { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', nativeName: 'Kannada' },
  MALAYALAM: { code: 'ml-IN', name: 'മലയാളം (Malayalam)', nativeName: 'Malayalam' },
  MARATHI: { code: 'mr-IN', name: 'मराठी (Marathi)', nativeName: 'Marathi' },
  GUJARATI: { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)', nativeName: 'Gujarati' },
  PUNJABI: { code: 'pa-IN', name: 'ਪੰਜਾਬੀ (Punjabi)', nativeName: 'Punjabi' },
  BENGALI: { code: 'bn-IN', name: 'বাংলা (Bengali)', nativeName: 'Bengali' },
  ODIA: { code: 'or-IN', name: 'ଓଡ଼ିଆ (Odia)', nativeName: 'Odia' },
  ASSAMESE: { code: 'as-IN', name: 'অসমীয়া (Assamese)', nativeName: 'Assamese' },
  URDU: { code: 'ur-IN', name: 'اردو (Urdu)', nativeName: 'Urdu' },
  ENGLISH: { code: 'en-IN', name: 'English (India)', nativeName: 'English' },
  ENGLISH_US: { code: 'en-US', name: 'English (US)', nativeName: 'English' },
};

export const LANGUAGE_CODES = Object.values(INDIAN_LANGUAGES).map((l) => l.code);

type NativeSpeechModule = {
  isAvailable: () => Promise<boolean>;
  startListening: (language: string) => Promise<boolean>;
  stopListening: () => Promise<boolean>;
  destroy: () => Promise<boolean>;
};

const NativeSpeech = NativeModules.NativeSpeechToText as NativeSpeechModule | undefined;
const EVENT_RESULT = 'NativeSpeechToTextResult';
const EVENT_ERROR = 'NativeSpeechToTextError';
const EVENT_END = 'NativeSpeechToTextEnd';

export class SpeechToTextService {
  private static isListening = false;
  private static transcript = '';
  private static selectedLanguage = 'hi-IN';
  private static webRecognition: any = null;

  static async startListening(
    onTranscript: (text: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await this.startWebSpeechRecognition(onTranscript, onError);
        return;
      }

      if (Platform.OS === 'android' && NativeSpeech) {
        await this.startAndroidNativeSpeechRecognition(onTranscript, onError);
        return;
      }

      Alert.alert(
        'Speech Input',
        'Native speech-to-text is currently available on Android in this build.'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError(errorMessage);
      console.error('Speech recognition error:', error);
    }
  }

  static async stopListening(): Promise<void> {
    this.isListening = false;
    if (Platform.OS === 'web') {
      this.stopWebSpeechRecognition();
      return;
    }

    if (Platform.OS === 'android' && NativeSpeech) {
      try {
        await NativeSpeech.stopListening();
      } catch (error) {
        console.error('Error stopping native speech recognition:', error);
      }
    }
  }

  private static async startAndroidNativeSpeechRecognition(
    onTranscript: (text: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const granted = await this.ensureAndroidMicPermission();
    if (!granted) {
      onError('Microphone permission denied');
      return;
    }

    const available = await NativeSpeech!.isAvailable();
    if (!available) {
      onError('Speech recognition is not available on this Android device.');
      return;
    }

    this.isListening = true;
    this.transcript = '';

    const emitter = new NativeEventEmitter(NativeModules.NativeSpeechToText);
    const resultSub = emitter.addListener(EVENT_RESULT, (payload: any) => {
      const text = payload?.text || '';
      if (!text) return;
      this.transcript = text;
      onTranscript(text);
    });
    const errorSub = emitter.addListener(EVENT_ERROR, (payload: any) => {
      const message = payload?.message || 'Speech recognition failed.';
      onError(message);
    });

    await NativeSpeech!.startListening(this.selectedLanguage);

    await new Promise<void>((resolve) => {
      const endSub = emitter.addListener(EVENT_END, () => {
        this.isListening = false;
        endSub.remove();
        resolve();
      });
    });

    resultSub.remove();
    errorSub.remove();
  }

  private static async ensureAndroidMicPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
    const hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) return true;

    const result = await PermissionsAndroid.request(permission, {
      title: 'Microphone Permission',
      message: 'Shiksha AI needs microphone access for speech-to-text in chat.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });

    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  private static initWebSpeechRecognition(): any {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;
    return new SpeechRecognition();
  }

  private static async startWebSpeechRecognition(
    onTranscript: (text: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const recognition = this.initWebSpeechRecognition();
    if (!recognition) {
      onError('Speech Recognition API not supported');
      return;
    }

    this.webRecognition = recognition;
    this.isListening = true;
    this.transcript = '';

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.language = this.selectedLanguage;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.transcript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      onTranscript((this.transcript + interimTranscript).trim());
    };

    recognition.onerror = (event: any) => {
      this.isListening = false;
      onError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      this.isListening = false;
      if (this.transcript.trim()) {
        onTranscript(this.transcript.trim());
      }
    };

    recognition.start();
  }

  private static stopWebSpeechRecognition(): void {
    if (!this.webRecognition) return;
    this.webRecognition.stop();
    this.webRecognition = null;
  }

  static isSupported(): boolean {
    if (Platform.OS === 'android') {
      return !!NativeSpeech;
    }
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return false;
      return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    }
    return false;
  }

  static async speak(text: string, language: string = 'en-IN', onDone?: () => void): Promise<void> {
    try {
      const languageMap: { [key: string]: string } = {
        English: 'en-IN',
        'en-IN': 'en-IN',
        'en-US': 'en-US',
        Hindi: 'hi-IN',
        'hi-IN': 'hi-IN',
        Marathi: 'mr-IN',
        'mr-IN': 'mr-IN',
        Tamil: 'ta-IN',
        'ta-IN': 'ta-IN',
        Telugu: 'te-IN',
        'te-IN': 'te-IN',
        Kannada: 'kn-IN',
        'kn-IN': 'kn-IN',
        Malayalam: 'ml-IN',
        'ml-IN': 'ml-IN',
        Gujarati: 'gu-IN',
        'gu-IN': 'gu-IN',
        Punjabi: 'pa-IN',
        'pa-IN': 'pa-IN',
        Bengali: 'bn-IN',
        'bn-IN': 'bn-IN',
      };

      const languageCode = languageMap[language] || 'en-IN';

      await Speech.speak(text, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.9,
        onDone,
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  }

  static async speakHindi(text: string, onDone?: () => void): Promise<void> {
    return this.speak(text, 'hi-IN', onDone);
  }

  static async speakEnglish(text: string, onDone?: () => void): Promise<void> {
    return this.speak(text, 'en-IN', onDone);
  }

  static async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  static async isSpeakingAsync(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      console.error('Error checking speaking status:', error);
      return false;
    }
  }

  static setLanguage(language: string): void {
    this.selectedLanguage = language;
    if (this.webRecognition) {
      this.webRecognition.language = language;
    }
  }
}
