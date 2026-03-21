import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  Modal,
  ScrollView,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendQuestion, processDocument } from '@/features/ai';
import { generateOfflineAnswer } from '@/features/ai';
import { detectMathExpression, solveMathDetection } from '@/features/ai';
import { detectLanguageRequest, translateAssistantResponse } from '@/features/ai';
import { getOfflineMode, getPreferredLanguage } from '@/features/user';
import { saveChat, getCurrentChat, clearCurrentChat } from '@/features/chat';
import { ChatBubble } from '@/features/chat';
import { SpeechToTextService } from '@/features/ai';
import { OCRService } from '@/features/ai';
import { getProfile } from '@/features/user';
import { VisionLanguageService } from '@/features/ai';
import * as ImageManipulator from 'expo-image-manipulator';
import { WelcomeSplash } from '@/features/onboarding';
import { TutorBotIllustration } from '@/features/onboarding';
import { SpotlightTutorial, SpotlightStep } from '@/features/onboarding';
import { Colors, Fonts, Shadows, Spacing, BorderRadius, useAppTheme } from '@/shared';

const { width } = Dimensions.get('window');
const ExpoCameraModule: any = (() => {
  try {
    return require('expo-camera');
  } catch {
    return null;
  }
})();
const CameraView = ExpoCameraModule?.CameraView;
const requestNativeCameraPermissions = ExpoCameraModule?.Camera?.requestCameraPermissionsAsync;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  imageUri?: string;
  extractedText?: string;
  tokensPerSec?: number;
}
type CaptureTask = 'vision' | 'ocr' | 'math';

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const OCR_CROP_MIN_SIZE = 64;

const CHAT_THEMES = {
  dark: {
    background: '#06070B',
    header: '#0F131D',
    headerBorder: 'rgba(255,255,255,0.08)',
    panel: '#10131A',
    panelBorder: 'rgba(255,255,255,0.08)',
    inputBg: '#111723',
    inputBorder: 'rgba(255,255,255,0.1)',
    text: '#F8FAFC',
    textMuted: '#8A93A8',
    accent: '#2DDCFF',
    badgeBg: '#1E2A52',
    badgeText: '#CFE6FF',
    actionBg: '#171C28',
  },
  light: {
    background: '#F4F6FB',
    header: '#FFFFFF',
    headerBorder: 'rgba(10,14,28,0.1)',
    panel: '#FFFFFF',
    panelBorder: 'rgba(10,14,28,0.12)',
    inputBg: '#FFFFFF',
    inputBorder: 'rgba(10,14,28,0.12)',
    text: '#0E1322',
    textMuted: '#65708A',
    accent: '#155EEF',
    badgeBg: '#E7EEFF',
    badgeText: '#1C3FA9',
    actionBg: '#EEF2FA',
  },
};

const QUICK_TOPICS = [
  { label: "Newton's Laws", emoji: '🍎', query: "Explain Newton's Three Laws of Motion with examples." },
  { label: 'Cell Structure', emoji: '🧫', query: 'What are the main parts of a plant and animal cell?' },
  { label: 'Quadratic Eq', emoji: '📐', query: 'How to solve quadratic equations using the formula?' },
  { label: 'French Revolution', emoji: '🇫🇷', query: 'What were the main causes of the French Revolution?' },
  { label: 'Tenses', emoji: '📝', query: 'Explain the difference between Present Perfect and Past Simple.' },
];

export default function TutorScreen() {
  const { isDark, toggleTheme } = useAppTheme();
  const router = useRouter();
  const chatTheme = isDark ? CHAT_THEMES.dark : CHAT_THEMES.light;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [isListening, setIsListening] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [userName, setUserName] = useState('Student');
  const [cameraTask, setCameraTask] = useState<CaptureTask | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [cameraBusy, setCameraBusy] = useState(false);
  const [showOcrCropper, setShowOcrCropper] = useState(false);
  const [ocrCropImageUri, setOcrCropImageUri] = useState<string | null>(null);
  const [sourceImageSize, setSourceImageSize] = useState({ width: 1, height: 1 });
  const [cropperLayout, setCropperLayout] = useState({ width: 1, height: 1 });
  const [cropBox, setCropBox] = useState<CropBox>({ x: 40, y: 40, width: 220, height: 160 });

  const flatListRef = useRef<FlatList>(null);
  const cameraRef = useRef<any>(null);
  const cropBoxRef = useRef<CropBox>(cropBox);
  const cropStartRef = useRef<CropBox>(cropBox);
  const resizeStartRef = useRef<CropBox>(cropBox);

  useEffect(() => {
    cropBoxRef.current = cropBox;
  }, [cropBox]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const isOffline = await getOfflineMode();
        setOfflineMode(isOffline);

        const lang = await getPreferredLanguage();
        setPreferredLanguage(lang);
      })();
      return () => { };
    }, [])
  );

  const loadInitialData = async () => {
    try {
      // Load current chat
      const savedChat = await getCurrentChat();
      if (savedChat && savedChat.messages && savedChat.messages.length > 0) {
        setMessages(savedChat.messages);
      } else {
        // Show welcome only for new chats
        const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome_v1');
        if (!hasSeenWelcome) {
          setShowWelcome(true);
          await AsyncStorage.setItem('hasSeenWelcome_v1', 'true');
        }
      }

      // Check tutorial status
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial_v1');
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }

      // Get profile info
      const profile = await getProfile();
      if (profile && profile.name) {
        setUserName(profile.name.split(' ')[0]);
      }

      // Get offline mode setting
      const isOffline = await getOfflineMode();
      setOfflineMode(isOffline);

      // Get preferred language
      const lang = await getPreferredLanguage();
      setPreferredLanguage(lang);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleSend = async (text: string = inputText, imageUri?: string) => {
    if (!text.trim() && !imageUri) return;

    const requestedLanguage = detectLanguageRequest(text);
    const normalizedQuestion = requestedLanguage ? requestedLanguage.cleanedQuestion : text;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
      imageUri,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      let responseText = '';
      let tps: number | undefined;

      if (offlineMode) {
        const response = await generateOfflineAnswer(normalizedQuestion);
        responseText = response.answer;
        if ((response as any).tokensPerSec) tps = (response as any).tokensPerSec;
      } else {
        if (imageUri) {
          responseText = await VisionLanguageService.analyzeImage(imageUri, normalizedQuestion || 'Explain this image');
        } else {
          const response = await sendQuestion(normalizedQuestion);
          responseText = response.answer;
        }
      }

      if (requestedLanguage) {
        const translated = await translateAssistantResponse(responseText, requestedLanguage);
        responseText = translated.text;

        if (translated.provider === 'mlkit') {
          responseText += `\n\nTranslated to ${requestedLanguage.languageName} using ML Kit.`;
        } else if (translated.provider === 'backend') {
          responseText += `\n\nTranslated to ${requestedLanguage.languageName} using translator fallback.`;
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        tokensPerSec: tps,
      };

      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);
      await saveChat(updatedMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to get answer. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const askSource = async (
    title: string,
    message: string
  ): Promise<'camera' | 'library' | null> =>
    new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: 'Camera', onPress: () => resolve('camera') },
        { text: 'Gallery', onPress: () => resolve('library') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });

  const pickFromLibrary = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your gallery.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    return result.canceled ? null : result.assets[0].uri;
  };

  const openNativeCamera = async (task: CaptureTask): Promise<boolean> => {
    if (!CameraView || !requestNativeCameraPermissions) {
      return false;
    }

    const permission = await requestNativeCameraPermissions();
    if (permission?.status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera access to capture images.');
      return true;
    }

    setCameraTask(task);
    return true;
  };

  const captureWithImagePickerCamera = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera access.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    return result.canceled ? null : result.assets[0].uri;
  };

  const extractTextWithFallback = async (
    imageUri: string
  ): Promise<{ text: string; source: 'ocr' | 'vision' }> => {
    try {
      const ocrResult = await OCRService.extractTextFromImage(imageUri);
      if (ocrResult.text && ocrResult.text.trim().length > 0) {
        return { text: ocrResult.text, source: 'ocr' };
      }
    } catch (ocrError) {
      console.log('Primary OCR failed, trying vision fallback...', ocrError);
    }

    const visionTextRaw = await VisionLanguageService.extractTextFromImage(imageUri);
    const visionText = OCRService.cleanOCRText(visionTextRaw || '');

    if (
      !visionText ||
      visionText.trim().length === 0 ||
      /failed to extract text|no readable text found/i.test(visionText)
    ) {
      throw new Error('No readable text found from OCR or vision fallback');
    }

    return { text: visionText, source: 'vision' };
  };

  const processOcrImage = async (imageUri: string) => {
    setLoading(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const extracted = await extractTextWithFallback(manipulated.uri);
      const validation = OCRService.validateExtractedText(extracted.text);

      if (validation.isValid) {
        Alert.alert(
          extracted.source === 'vision' ? 'Text Scanned (Fallback)' : 'Text Scanned',
          'What would you like to do with this extracted text?',
          [
            {
              text: 'Insert Text',
              onPress: () => {
                setInputText((prev) => (prev ? `${prev}\n\n${extracted.text}` : extracted.text));
              },
            },
            {
              text: 'Ask AI Tutor',
              onPress: async () => {
                await handleSend(`Explain this extracted text:\n\n${extracted.text}`);
              },
            },
            {
              text: 'Fix OCR + Insert',
              onPress: async () => {
                setLoading(true);
                try {
                  const result = await processDocument(extracted.text, 'correct');
                  setInputText((prev) => (prev ? `${prev}\n\n${result}` : result));
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('OCR Result', validation.message);
      }
    } catch (error) {
      console.error('OCR error:', error);
      Alert.alert('Error', 'Failed to scan text. Try a clearer image or better crop area.');
    } finally {
      setLoading(false);
    }
  };

  const openOcrCropper = async (imageUri: string) => {
    try {
      const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(
          imageUri,
          (widthPx, heightPx) => resolve({ width: widthPx, height: heightPx }),
          reject
        );
      });

      setSourceImageSize(size);
      setOcrCropImageUri(imageUri);
      setShowOcrCropper(true);
    } catch (error) {
      console.error('Failed to open cropper:', error);
      await processOcrImage(imageUri);
    }
  };

  const getDisplayedImageMetrics = () => {
    const scale = Math.min(
      cropperLayout.width / sourceImageSize.width,
      cropperLayout.height / sourceImageSize.height
    );

    const widthPx = sourceImageSize.width * scale;
    const heightPx = sourceImageSize.height * scale;
    const offsetX = (cropperLayout.width - widthPx) / 2;
    const offsetY = (cropperLayout.height - heightPx) / 2;

    return { scale, widthPx, heightPx, offsetX, offsetY };
  };

  const clampCropBox = (next: CropBox): CropBox => {
    const { widthPx, heightPx, offsetX, offsetY } = getDisplayedImageMetrics();
    const widthPxClamped = Math.max(OCR_CROP_MIN_SIZE, Math.min(next.width, widthPx));
    const heightPxClamped = Math.max(OCR_CROP_MIN_SIZE, Math.min(next.height, heightPx));
    const maxX = offsetX + widthPx - widthPxClamped;
    const maxY = offsetY + heightPx - heightPxClamped;

    return {
      x: Math.max(offsetX, Math.min(next.x, maxX)),
      y: Math.max(offsetY, Math.min(next.y, maxY)),
      width: widthPxClamped,
      height: heightPxClamped,
    };
  };

  const resetCropBox = () => {
    const { widthPx, heightPx, offsetX, offsetY } = getDisplayedImageMetrics();
    const boxWidth = Math.max(120, widthPx * 0.75);
    const boxHeight = Math.max(90, heightPx * 0.35);
    const next = {
      x: offsetX + (widthPx - boxWidth) / 2,
      y: offsetY + (heightPx - boxHeight) / 2,
      width: boxWidth,
      height: boxHeight,
    };
    setCropBox(clampCropBox(next));
  };

  const applySelectedCropForOcr = async () => {
    if (!ocrCropImageUri) return;

    setLoading(true);
    setShowOcrCropper(false);

    try {
      const { scale, offsetX, offsetY } = getDisplayedImageMetrics();
      const selected = cropBoxRef.current;

      const rawOriginX = Math.max(0, Math.round((selected.x - offsetX) / scale));
      const rawOriginY = Math.max(0, Math.round((selected.y - offsetY) / scale));
      const rawWidth = Math.max(1, Math.round(selected.width / scale));
      const rawHeight = Math.max(1, Math.round(selected.height / scale));

      // Clamp crop rectangle to the source image bounds to avoid invalid crop regions.
      const originX = Math.min(rawOriginX, Math.max(0, sourceImageSize.width - 1));
      const originY = Math.min(rawOriginY, Math.max(0, sourceImageSize.height - 1));
      const width = Math.max(1, Math.min(rawWidth, sourceImageSize.width - originX));
      const height = Math.max(1, Math.min(rawHeight, sourceImageSize.height - originY));

      const crop = {
        originX,
        originY,
        width,
        height,
      };

      const cropped = await ImageManipulator.manipulateAsync(
        ocrCropImageUri,
        [{ crop }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      await processOcrImage(cropped.uri);
    } catch (error) {
      console.error('Crop+OCR error:', error);
      Alert.alert('Error', 'Failed to crop selected area. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cropPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        cropStartRef.current = cropBoxRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const moved = {
          ...cropStartRef.current,
          x: cropStartRef.current.x + gestureState.dx,
          y: cropStartRef.current.y + gestureState.dy,
        };
        setCropBox(clampCropBox(moved));
      },
    })
  ).current;

  const cropResizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        resizeStartRef.current = cropBoxRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const resized = {
          ...resizeStartRef.current,
          width: resizeStartRef.current.width + gestureState.dx,
          height: resizeStartRef.current.height + gestureState.dy,
        };
        setCropBox(clampCropBox(resized));
      },
    })
  ).current;

  const processMathImage = async (imageUri: string) => {
    setLoading(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const extracted = await extractTextWithFallback(manipulated.uri);
      const detection = detectMathExpression(extracted.text);

      if (!detection) {
        Alert.alert(
          'Math not detected',
          'We could not find a clear math expression in the image. Try cropping tighter around the equation and try again.'
        );
        return;
      }

      const solution = solveMathDetection(detection);
      if (!solution) {
        try {
          const aiResponse = await sendQuestion(`Solve and explain this math problem Step-by-Step: ${extracted.text}`);
          const userMsg: Message = {
            id: Date.now().toString(),
            text: 'Math problem from image (Algebraic)',
            isUser: true,
            timestamp: new Date(),
            imageUri: manipulated.uri,
            extractedText: extracted.text,
          };
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: aiResponse.answer,
            isUser: false,
            timestamp: new Date(),
          };
          const updatedMessages = [...messages, userMsg, aiMsg];
          setMessages(updatedMessages);
          await saveChat(updatedMessages);
        } catch {
          Alert.alert('Math error', 'The expression could not be evaluated automatically. Try a simpler expression or ask the AI tutor.');
        }
        return;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        text: 'Math problem from image',
        isUser: true,
        timestamp: new Date(),
        imageUri: manipulated.uri,
        extractedText: extracted.text,
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `🧮 Math Solver\nProblem: ${detection.originalLine}\n${solution.explanation}\n${solution.answer}\n${solution.latex}`,
        isUser: false,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage, aiMessage];
      setMessages(updatedMessages);
      await saveChat(updatedMessages);
    } catch (error) {
      console.error('Math solve error:', error);
      Alert.alert('Error', 'Failed to solve the math problem. Try again with a clearer image.');
    } finally {
      setLoading(false);
    }
  };

  const routeCapturedImage = async (task: CaptureTask, imageUri: string) => {
    if (task === 'vision') {
      await handleSend('Please explain what is in this image:', imageUri);
      return;
    }
    if (task === 'ocr') {
      await openOcrCropper(imageUri);
      return;
    }
    await processMathImage(imageUri);
  };

  const handleImagePick = async () => {
    const source = await askSource('Upload Image', 'Choose a source');
    if (!source) return;
    if (source === 'library') {
      const uri = await pickFromLibrary();
      if (uri) await routeCapturedImage('vision', uri);
      return;
    }

    const opened = await openNativeCamera('vision');
    if (!opened) {
      const uri = await captureWithImagePickerCamera();
      if (uri) await routeCapturedImage('vision', uri);
    }
  };

  const handleScanText = async () => {
    const source = await askSource(
      'Scan Text (OCR)',
      'Choose a source. For best results, crop only the relevant paragraph after selection.'
    );
    if (!source) return;
    if (source === 'library') {
      const uri = await pickFromLibrary();
      if (uri) await routeCapturedImage('ocr', uri);
      return;
    }

    const opened = await openNativeCamera('ocr');
    if (!opened) {
      const uri = await captureWithImagePickerCamera();
      if (uri) await routeCapturedImage('ocr', uri);
    }
  };

  const handleMathProblemScan = async () => {
    const source = await askSource(
      'Solve Math Problem',
      'Capture a math equation or expression and let Shiksha AI compute the answer.'
    );
    if (!source) return;
    if (source === 'library') {
      const uri = await pickFromLibrary();
      if (uri) await routeCapturedImage('math', uri);
      return;
    }

    const opened = await openNativeCamera('math');
    if (!opened) {
      const uri = await captureWithImagePickerCamera();
      if (uri) await routeCapturedImage('math', uri);
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || !cameraTask || cameraBusy) return;
    setCameraBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setCameraTask(null);
      if (photo?.uri) {
        await routeCapturedImage(cameraTask, photo.uri);
      }
    } catch (error) {
      console.error('Camera capture failed:', error);
      Alert.alert('Camera Error', 'Could not capture photo. Please try again.');
    } finally {
      setCameraBusy(false);
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const startListening = async () => {
    setIsListening(true);
    try {
      await SpeechToTextService.startListening(
        (text) => {
          if (text) setInputText(text);
        },
        (error) => {
          console.error('Speech recognition error:', error);
        }
      );
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setIsListening(false);
    }
  };

  const handleNewChat = () => {
    Alert.alert(
      'New Conversation',
      'Start a fresh chat? Your current history will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Chat',
          onPress: async () => {
            await clearCurrentChat();
            setMessages([]);
          }
        }
      ]
    );
  };

  const handleTutorialFinish = async () => {
    await AsyncStorage.setItem('hasSeenTutorial_v1', 'true');
    setShowTutorial(false);
  };

  const tutorialSteps: SpotlightStep[] = [
    {
      targetId: 'header-mode',
      title: 'Online & Offline Mode',
      description: 'Switch to offline mode in settings to use Shiksha AI without internet.',
    },
    {
      targetId: 'attach-btn',
      title: 'Snap a Problem',
      description: 'Upload a photo of your textbook or notebook to get instant explanations.',
    },
    {
      targetId: 'scan-btn',
      title: 'Extract Text',
      description: 'Use OCR to convert your handwritten or printed notes into editable text.',
    },
    {
      targetId: 'voice-btn',
      title: 'Talk to your Tutor',
      description: 'Use the mic to ask questions hands-free.',
    },
  ];

  const themedStyles = useMemo(
    () => ({
      container: { backgroundColor: chatTheme.background },
      header: {
        backgroundColor: chatTheme.header,
        borderBottomColor: chatTheme.headerBorder,
      },
      headerActionCircle: {
        backgroundColor: chatTheme.actionBg,
        borderColor: chatTheme.headerBorder,
      },
      askImageBadge: {
        backgroundColor: chatTheme.badgeBg,
      },
      headerTitleText: { color: chatTheme.badgeText },
      modelText: { color: chatTheme.textMuted },
      iconText: { color: chatTheme.text },
      emptyTitle: { color: chatTheme.text },
      emptySubtitle: { color: chatTheme.textMuted },
      heroIconBg: {
        backgroundColor: chatTheme.panel,
        borderColor: chatTheme.panelBorder,
      },
      topicCard: {
        backgroundColor: chatTheme.panel,
        borderColor: chatTheme.panelBorder,
      },
      topicLabel: { color: chatTheme.text },
      modelLabel: { color: chatTheme.textMuted },
      loadingText: { color: chatTheme.textMuted },
      inputWrapper: { backgroundColor: chatTheme.background },
      inputRow: {
        backgroundColor: chatTheme.inputBg,
        borderColor: chatTheme.inputBorder,
      },
      inputText: { color: chatTheme.text },
      sendBtn: { backgroundColor: chatTheme.accent },
    }),
    [chatTheme]
  );

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Screenshot-style Header */}
      <View style={[styles.header, themedStyles.header]}>
        <TouchableOpacity onPress={() => router.push('/dashboard')} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={24} color={chatTheme.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={[styles.askImageBadge, themedStyles.askImageBadge]}>
            <Ionicons name="sparkles" size={14} color={chatTheme.badgeText} style={{ marginRight: 4 }} />
            <Text style={[styles.headerTitleText, themedStyles.headerTitleText]}>AI Tutor</Text>
          </View>
          <TouchableOpacity style={styles.modelSelector}>
            <Text style={[styles.modelSelectorText, themedStyles.modelText]}>{offlineMode ? 'Offline Mode' : 'Online Mode'}</Text>
            <Ionicons name="chevron-down" size={12} color={chatTheme.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={[styles.headerAction, styles.plusBtnCircle, themedStyles.headerActionCircle]} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={chatTheme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerAction, styles.plusBtnCircle, themedStyles.headerActionCircle]} onPress={handleNewChat}>
            <Ionicons name="add" size={22} color={chatTheme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyState}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.welcomeHero}>
              <View style={styles.heroIconContainer}>
                <View style={styles.heroIconBg}>
                  <View style={[StyleSheet.absoluteFillObject as any, themedStyles.heroIconBg, { borderRadius: 50, borderWidth: 1 }]} />
                  <TutorBotIllustration width={80} height={80} />
                </View>
              </View>
              <Text style={[styles.welcomeTitle, themedStyles.emptyTitle]}>New Session</Text>
              <Text style={[styles.welcomeSubtitle, themedStyles.emptySubtitle]}>
                Type a message or upload an image to start learning with Shiksha AI.
              </Text>
            </View>

            <View style={styles.quickTopicsContainer}>
              {QUICK_TOPICS.map((topic, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.topicCard, themedStyles.topicCard]}
                  onPress={() => handleSend(topic.query)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.topicLabel, themedStyles.topicLabel]}>{topic.emoji} {topic.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View>
                {!item.isUser && (
                  <Text style={[styles.modelPlatformLabel, themedStyles.modelLabel]}>{offlineMode ? 'Model on Device' : 'Model on Cloud'}</Text>
                )}
                <ChatBubble
                  text={item.text}
                  isUser={item.isUser}
                  timestamp={item.timestamp}
                  imageUri={item.imageUri}
                  extractedText={item.extractedText}
                  preferredLanguage={preferredLanguage}
                  tokensPerSec={item.tokensPerSec}
                />
              </View>
            )}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={chatTheme.accent} />
            <Text style={[styles.loadingText, themedStyles.loadingText]}>Thinking...</Text>
          </View>
        )}

        <View style={[styles.inputWrapper, themedStyles.inputWrapper]}>
          <View style={[styles.inputRow, themedStyles.inputRow]}>
            <TouchableOpacity
              onPress={handleImagePick}
              style={styles.plusBtn}
            >
              <Ionicons name="add" size={28} color={chatTheme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleScanText}
              style={styles.ocrBtn}
            >
              <Ionicons name="scan-outline" size={20} color={chatTheme.textMuted} />
            </TouchableOpacity>

            <TextInput
              style={[styles.inputField, themedStyles.inputText]}
              placeholder="Type prompt..."
              placeholderTextColor={chatTheme.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />

            {!inputText.trim() && (
              <TouchableOpacity onPress={startListening} style={styles.micBtn}>
                <Ionicons name="mic-outline" size={24} color={chatTheme.textMuted} />
              </TouchableOpacity>
            )}

            {inputText.trim() ? (
              <TouchableOpacity
                onPress={() => handleSend()}
                disabled={loading}
                style={[styles.sendIconBtn, themedStyles.sendBtn]}
              >
                <Ionicons name="send" size={20} color={isDark ? '#03111A' : '#FFFFFF'} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>

      <WelcomeSplash
        visible={showWelcome}
        onClose={() => {
          setShowWelcome(false);
          setShowTutorial(true);
        }}
      />

      <Modal visible={!!cameraTask} animationType="slide" onRequestClose={() => setCameraTask(null)}>
        <View style={styles.cameraRoot}>
          {CameraView ? (
            <CameraView ref={cameraRef} style={styles.cameraPreview} facing={cameraFacing} />
          ) : (
            <View style={styles.cameraUnsupported}>
              <Text style={styles.cameraUnsupportedText}>Native camera module is unavailable.</Text>
            </View>
          )}

          <View style={styles.cameraTopBar}>
            <TouchableOpacity style={styles.cameraIconBtn} onPress={() => setCameraTask(null)}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraIconBtn} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.cameraBottomBar}>
            <TouchableOpacity
              style={[styles.captureButton, cameraBusy && styles.captureButtonDisabled]}
              onPress={handleTakePhoto}
              disabled={cameraBusy}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showOcrCropper}
        animationType="slide"
        onRequestClose={() => setShowOcrCropper(false)}
      >
        <SafeAreaView style={styles.cropperContainer}>
          <View style={styles.cropperHeader}>
            <TouchableOpacity onPress={() => setShowOcrCropper(false)} style={styles.cropperHeaderBtn}>
              <Ionicons name="close" size={22} color={Colors.gray900} />
            </TouchableOpacity>
            <Text style={styles.cropperTitle}>Select OCR Area</Text>
            <TouchableOpacity onPress={resetCropBox} style={styles.cropperHeaderBtn}>
              <Ionicons name="refresh" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.cropperHint}>Drag to move. Pull the bottom-right handle to resize.</Text>

          <View
            style={styles.cropperCanvas}
            onLayout={(event) => {
              const { width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
              setCropperLayout({ width: layoutWidth, height: layoutHeight });
              setTimeout(resetCropBox, 0);
            }}
          >
            {ocrCropImageUri ? (
              <Image source={{ uri: ocrCropImageUri }} style={styles.cropperImage} resizeMode="contain" />
            ) : null}

            <View
              style={[
                styles.cropSelection,
                {
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.width,
                  height: cropBox.height,
                },
              ]}
              {...cropPanResponder.panHandlers}
            >
              <Text style={styles.cropSelectionLabel}>Move</Text>
              <View style={styles.cropResizeHandle} {...cropResizeResponder.panHandlers}>
                <Ionicons name="resize" size={13} color={Colors.white} />
              </View>
            </View>
          </View>

          <View style={styles.cropperActions}>
            <TouchableOpacity style={styles.cropCancelBtn} onPress={() => setShowOcrCropper(false)}>
              <Text style={styles.cropCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cropApplyBtn} onPress={applySelectedCropForOcr}>
              <Text style={styles.cropApplyText}>Scan Selected Part</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <SpotlightTutorial
        visible={showTutorial}
        steps={tutorialSteps}
        onFinish={handleTutorialFinish}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerAction: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  askImageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  headerTitleText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modelSelectorText: {
    color: Colors.gray500,
    fontSize: 12,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  plusBtnCircle: {
    backgroundColor: Colors.gray50,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    padding: 20,
    paddingBottom: 20,
  },
  emptyState: {
    flexGrow: 1,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeHero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroIconContainer: {
    marginBottom: 20,
  },
  heroIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gray900,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 30,
  },
  quickTopicsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  quickTopicsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray100,
  },
  quickTopicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  topicCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.gray50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  topicEmojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicEmoji: {
    fontSize: 20,
  },
  topicLabel: {
    fontSize: 14,
    color: Colors.gray800,
    fontWeight: '500',
  },
  modelPlatformLabel: {
    fontSize: 12,
    color: Colors.gray400,
    marginTop: 18,
    marginBottom: -4,
    paddingHorizontal: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: Colors.gray400,
    fontSize: 12,
  },
  inputWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  plusBtn: {
    marginRight: 10,
  },
  ocrBtn: {
    marginRight: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    color: Colors.gray900,
    fontSize: 16,
    paddingVertical: 8,
  },
  micBtn: {
    paddingHorizontal: 8,
  },
  sendIconBtn: {
    backgroundColor: Colors.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cameraRoot: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraUnsupported: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraUnsupportedText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  cameraTopBar: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cameraBottomBar: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.white,
  },
  cropperContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  cropperHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  cropperHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray50,
  },
  cropperTitle: {
    fontSize: 18,
    color: Colors.gray900,
    fontWeight: '700',
  },
  cropperHint: {
    paddingHorizontal: 20,
    paddingTop: 10,
    color: Colors.gray500,
    fontSize: 13,
  },
  cropperCanvas: {
    flex: 1,
    marginHorizontal: 12,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.black,
  },
  cropperImage: {
    width: '100%',
    height: '100%',
  },
  cropSelection: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropResizeHandle: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  cropSelectionLabel: {
    color: Colors.white,
    backgroundColor: 'rgba(0,0,0,0.45)',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cropperActions: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    gap: 10,
  },
  cropCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  cropCancelText: {
    color: Colors.gray700,
    fontSize: 15,
    fontWeight: '600',
  },
  cropApplyBtn: {
    flex: 1.7,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  cropApplyText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
