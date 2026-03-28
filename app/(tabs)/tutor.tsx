import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendQuestion, processDocument } from '@/features/ai';
import { generateOfflineAnswer } from '@/features/ai';
import { detectMathExpression, solveMathDetection } from '@/features/ai';
import { detectLanguageRequest, translateAssistantResponse } from '@/features/ai';
import { getOfflineMode, getPreferredLanguage } from '@/features/user';
import { recordQuestionAsked } from '@/features/progress';
import { saveChat, getCurrentChat, clearCurrentChat } from '@/features/chat';
import { ChatBubble } from '@/features/chat';
import { SpeechToTextService } from '@/features/ai';
import { OCRService } from '@/features/ai';
import { getProfile } from '@/features/user';
import * as ImageManipulator from 'expo-image-manipulator';
import { WelcomeSplash } from '@/features/onboarding';
import { SpotlightTutorial, SpotlightStep } from '@/features/onboarding';
import { useAppTheme } from '@/shared';
import { DARK_THEME, LIGHT_THEME, AppTheme, Spacing } from '@/shared';

const { width } = Dimensions.get('window');

const ExpoCameraModule: any = (() => {
  try { return require('expo-camera'); } catch { return null; }
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
type CaptureTask = 'ocr' | 'math';

interface CropBox { x: number; y: number; width: number; height: number; }
const OCR_CROP_MIN_SIZE = 64;

// ── Quick topic chips ───────────────────────────────────────────────────────────
const QUICK_TOPICS = [
  { label: "Newton's Laws",  emoji: '🍎', query: "Explain Newton's Three Laws of Motion with examples." },
  { label: 'Cell Structure', emoji: '🧬', query: 'What are the main parts of a plant and animal cell?' },
  { label: 'Quadratic Eq',   emoji: '📐', query: 'How to solve quadratic equations using the formula?' },
  { label: 'French Rev.',    emoji: '🏛️', query: 'What were the main causes of the French Revolution?' },
  { label: 'Tenses',         emoji: '📝', query: 'Explain the difference between Present Perfect and Past Simple.' },
];

// ── Action bar tools ────────────────────────────────────────────────────────────
const TOOL_ITEMS = [
  { id: 'ocr',  icon: 'scan-outline',           label: 'Scan Text',    color: '#818CF8' },
  { id: 'math', icon: 'calculator-outline',      label: 'Math Solver',  color: '#34D399' },
  { id: 'hist', icon: 'time-outline',            label: 'History',      color: '#F59E0B' },
] as const;

const OFFICIAL_LOGO = require('../../assets/adaptive-icon.png');

export default function TutorScreen() {
  const { isDark, toggleTheme } = useAppTheme();
  const theme: AppTheme = isDark ? DARK_THEME : LIGHT_THEME;
  const router = useRouter();

  // ── State ───────────────────────────────────────────────────────────────────
  const [messages, setMessages]             = useState<Message[]>([]);
  const [inputText, setInputText]           = useState('');
  const [loading, setLoading]               = useState(false);
  const [offlineMode, setOfflineMode]       = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [isListening, setIsListening]       = useState(false);
  const [showWelcome, setShowWelcome]       = useState(false);
  const [showTutorial, setShowTutorial]     = useState(false);
  const [userName, setUserName]             = useState('Student');
  const [cameraTask, setCameraTask]         = useState<CaptureTask | null>(null);
  const [cameraFacing, setCameraFacing]     = useState<'back' | 'front'>('back');
  const [cameraBusy, setCameraBusy]         = useState(false);
  const [showOcrCropper, setShowOcrCropper] = useState(false);
  const [ocrCropImageUri, setOcrCropImageUri] = useState<string | null>(null);
  const [sourceImageSize, setSourceImageSize] = useState({ width: 1, height: 1 });
  const [cropperLayout, setCropperLayout]   = useState({ width: 1, height: 1 });
  const [cropBox, setCropBox]               = useState<CropBox>({ x: 40, y: 40, width: 220, height: 160 });
  const [showTools, setShowTools]           = useState(false);
  const [inputFocused, setInputFocused]     = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const flatListRef   = useRef<FlatList>(null);
  const cameraRef     = useRef<any>(null);
  const cropBoxRef    = useRef<CropBox>(cropBox);
  const cropStartRef  = useRef<CropBox>(cropBox);
  const resizeStartRef = useRef<CropBox>(cropBox);

  // ── Animations ──────────────────────────────────────────────────────────────
  const headerFade = useRef(new Animated.Value(0)).current;
  const listFade   = useRef(new Animated.Value(0)).current;
  const toolsSlide = useRef(new Animated.Value(60)).current;
  const toolsFade  = useRef(new Animated.Value(0)).current;
  const micPulse   = useRef(new Animated.Value(1)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(listFade,   { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Typing indicator dots
  useEffect(() => {
    if (!loading) return;
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 300, useNativeDriver: true }),
        ])
      );
    const a1 = animate(typingDot1, 0);
    const a2 = animate(typingDot2, 150);
    const a3 = animate(typingDot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); typingDot1.setValue(0); typingDot2.setValue(0); typingDot3.setValue(0); };
  }, [loading]);

  // Mic pulse
  useEffect(() => {
    if (!isListening) { micPulse.setValue(1); return; }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isListening]);

  // Tools panel animation
  useEffect(() => {
    if (showTools) {
      toolsSlide.setValue(60);
      toolsFade.setValue(0);
      Animated.parallel([
        Animated.spring(toolsSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.timing(toolsFade,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(toolsFade, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  }, [showTools]);

  useEffect(() => { cropBoxRef.current = cropBox; }, [cropBox]);

  const closeOcrCropper = () => {
    setShowOcrCropper(false);
    setOcrCropImageUri(null);
    setSourceImageSize({ width: 1, height: 1 });
    setCropperLayout({ width: 1, height: 1 });
  };

  useEffect(() => {
    if (showOcrCropper && cropperLayout.width > 50 && cropperLayout.height > 50 &&
        sourceImageSize.width > 1 && sourceImageSize.height > 1) {
      const t = setTimeout(resetCropBox, 100);
      return () => clearTimeout(t);
    }
  }, [showOcrCropper, cropperLayout.width, cropperLayout.height, sourceImageSize.width, sourceImageSize.height]);

  useEffect(() => { loadInitialData(); }, []);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        setOfflineMode(await getOfflineMode());
        setPreferredLanguage(await getPreferredLanguage());
      })();
      return () => {};
    }, [])
  );

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadInitialData = async () => {
    try {
      const savedChat = await getCurrentChat();
      if (savedChat && savedChat.messages && savedChat.messages.length > 0) {
        setMessages(savedChat.messages);
      } else {
        const seen = await AsyncStorage.getItem('hasSeenWelcome_v1');
        if (!seen) { setShowWelcome(true); await AsyncStorage.setItem('hasSeenWelcome_v1', 'true'); }
      }
      const seenTutorial = await AsyncStorage.getItem('hasSeenTutorial_v1');
      if (!seenTutorial) setShowTutorial(true);
      const profile = await getProfile();
      if (profile?.name) setUserName(profile.name.split(' ')[0]);
      setOfflineMode(await getOfflineMode());
      setPreferredLanguage(await getPreferredLanguage());
    } catch (e) { console.error('loadInitialData:', e); }
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = async (text: string = inputText, imageUri?: string) => {
    if (!text.trim()) return;
    const requestedLanguage = detectLanguageRequest(text);
    const normalizedQ       = requestedLanguage ? requestedLanguage.cleanedQuestion : text;

    const userMsg: Message = { id: Date.now().toString(), text: text.trim(), isUser: true, timestamp: new Date(), imageUri };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      let responseText = '';
      let tps: number | undefined;

      if (offlineMode) {
        const r = await generateOfflineAnswer(normalizedQ);
        responseText = r.answer;
        if ((r as any).tokensPerSec) tps = (r as any).tokensPerSec;
      } else {
        responseText = (await sendQuestion(normalizedQ)).answer;
      }

      if (requestedLanguage) {
        const translated = await translateAssistantResponse(responseText, requestedLanguage);
        responseText = translated.text;
        if (translated.provider === 'mlkit') responseText += `\n\n_Translated to ${requestedLanguage.languageName} using ML Kit._`;
        else if (translated.provider === 'backend') responseText += `\n\n_Translated to ${requestedLanguage.languageName}._`;
      }

      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: responseText, isUser: false, timestamp: new Date(), tokensPerSec: tps };
      const updated = [...newMessages, aiMsg];
      setMessages(updated);
      await saveChat(updated);

      // Track question for real-time dashboard updates
      await recordQuestionAsked('General');
    } catch {
      Alert.alert('Connection Error', 'Failed to get a response. Check your internet or switch to offline mode.');
    } finally {
      setLoading(false);
    }
  };

  // ── Image / camera helpers ──────────────────────────────────────────────────
  const askSource = (title: string, message: string): Promise<'camera' | 'library' | null> =>
    new Promise(resolve => Alert.alert(title, message, [
      { text: 'Camera',  onPress: () => resolve('camera') },
      { text: 'Gallery', onPress: () => resolve('library') },
      { text: 'Cancel',  style: 'cancel', onPress: () => resolve(null) },
    ]));

  const pickFromLibrary = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'We need access to your gallery.'); return null; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    return r.canceled ? null : r.assets[0].uri;
  };

  const openNativeCamera = async (task: CaptureTask): Promise<boolean> => {
    if (!CameraView || !requestNativeCameraPermissions) return false;
    const p = await requestNativeCameraPermissions();
    if (p?.status !== 'granted') { Alert.alert('Permission needed', 'We need camera access.'); return true; }
    setCameraTask(task);
    return true;
  };

  const captureWithImagePickerCamera = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'We need camera access.'); return null; }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    return r.canceled ? null : r.assets[0].uri;
  };

  const extractTextFromOcr = async (imageUri: string): Promise<string> => {
    const ocrResult = await OCRService.extractTextFromImage(imageUri);
    if (!ocrResult.text?.trim()) throw new Error('No readable text found');
    return ocrResult.text;
  };

  const processOcrImage = async (imageUri: string) => {
    setLoading(true);
    try {
      const manip = await ImageManipulator.manipulateAsync(imageUri, [], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
      const extracted = await extractTextFromOcr(manip.uri);
      const validation = OCRService.validateExtractedText(extracted);
      if (validation.isValid) {
        Alert.alert('Text Scanned ✅', 'What would you like to do?', [
          { text: 'Insert Text',   onPress: () => setInputText(p => p ? `${p}\n\n${extracted}` : extracted) },
          { text: 'Ask AI Tutor',  onPress: async () => handleSend(`Explain this text:\n\n${extracted}`) },
          { text: 'Fix & Insert',  onPress: async () => { setLoading(true); try { const corrected = await processDocument(extracted,'correct'); setInputText(p => p ? `${p}\n\n${corrected}` : corrected); } finally { setLoading(false); } } },
        ]);
      } else { Alert.alert('OCR Result', validation.message); }
    } catch { Alert.alert('Error', 'Failed to scan text. Try a clearer image.'); }
    finally { setLoading(false); }
  };

  const openOcrCropper = async (imageUri: string) => {
    try {
      const size = await new Promise<{ width: number; height: number }>((res, rej) =>
        Image.getSize(imageUri, (w, h) => res({ width: w, height: h }), rej));
      setSourceImageSize(size);
      setOcrCropImageUri(imageUri);
      setShowOcrCropper(true);
    } catch { await processOcrImage(imageUri); }
  };

  const getDisplayedImageMetrics = () => {
    if (cropperLayout.width < 1 || cropperLayout.height < 1 || sourceImageSize.width < 1 || sourceImageSize.height < 1) return null;
    const scale = Math.min(cropperLayout.width / sourceImageSize.width, cropperLayout.height / sourceImageSize.height);
    if (!Number.isFinite(scale) || scale <= 0) return null;
    const widthPx  = sourceImageSize.width  * scale;
    const heightPx = sourceImageSize.height * scale;
    const offsetX  = (cropperLayout.width  - widthPx)  / 2;
    const offsetY  = (cropperLayout.height - heightPx) / 2;
    return { scale, widthPx, heightPx, offsetX, offsetY };
  };

  const clampCropBox = (next: CropBox): CropBox => {
    if (cropperLayout.width < 50 || cropperLayout.height < 50) return next;
    const m = getDisplayedImageMetrics();
    if (!m) return next;
    const { widthPx, heightPx, offsetX, offsetY } = m;
    const w = Math.max(OCR_CROP_MIN_SIZE, Math.min(next.width, widthPx));
    const h = Math.max(OCR_CROP_MIN_SIZE, Math.min(next.height, heightPx));
    return { x: Math.max(offsetX, Math.min(next.x, offsetX + widthPx - w)), y: Math.max(offsetY, Math.min(next.y, offsetY + heightPx - h)), width: w, height: h };
  };

  const resetCropBox = () => {
    if (cropperLayout.width < 50 || cropperLayout.height < 50 || sourceImageSize.width < 10 || sourceImageSize.height < 10) return;
    const m = getDisplayedImageMetrics();
    if (!m) return;
    const { widthPx, heightPx, offsetX, offsetY } = m;
    setCropBox(clampCropBox({ x: offsetX + (widthPx - widthPx * 0.75) / 2, y: offsetY + (heightPx - heightPx * 0.35) / 2, width: Math.max(120, widthPx * 0.75), height: Math.max(90, heightPx * 0.35) }));
  };

  const applySelectedCropForOcr = async () => {
    if (!ocrCropImageUri) return;
    const m = getDisplayedImageMetrics();
    if (!m) { Alert.alert('Error', 'Image not ready. Please wait.'); return; }
    setLoading(true);
    try {
      const { scale, offsetX, offsetY } = m;
      const s = cropBoxRef.current;
      const originX = Math.min(Math.max(0, Math.round((s.x - offsetX) / scale)), Math.max(0, sourceImageSize.width - 1));
      const originY = Math.min(Math.max(0, Math.round((s.y - offsetY) / scale)), Math.max(0, sourceImageSize.height - 1));
      const cropW = Math.max(1, Math.min(Math.round(s.width / scale), sourceImageSize.width - originX));
      const cropH = Math.max(1, Math.min(Math.round(s.height / scale), sourceImageSize.height - originY));
      const cropped = await ImageManipulator.manipulateAsync(ocrCropImageUri, [{ crop: { originX, originY, width: cropW, height: cropH } }], { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG });
      closeOcrCropper();
      await processOcrImage(cropped.uri);
    } catch { Alert.alert('Error', 'Crop failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const cropPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: () => { cropStartRef.current = cropBoxRef.current; },
    onPanResponderMove: (_, g) => setCropBox(clampCropBox({ ...cropStartRef.current, x: cropStartRef.current.x + g.dx, y: cropStartRef.current.y + g.dy })),
  })).current;

  const cropResizeResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: () => { resizeStartRef.current = cropBoxRef.current; },
    onPanResponderMove: (_, g) => setCropBox(clampCropBox({ ...resizeStartRef.current, width: resizeStartRef.current.width + g.dx, height: resizeStartRef.current.height + g.dy })),
  })).current;

  const processMathImage = async (imageUri: string) => {
    setLoading(true);
    try {
      const manip = await ImageManipulator.manipulateAsync(imageUri, [], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
      const extracted = await extractTextFromOcr(manip.uri);
      const detection = detectMathExpression(extracted);
      if (!detection) { Alert.alert('Math not detected', 'No clear equation found. Try cropping closer.'); return; }
      const solution = solveMathDetection(detection);
      if (!solution) {
        try {
          const r = await sendQuestion(`Solve step-by-step: ${extracted}`);
          const upd = [...messages, { id: Date.now().toString(), text: 'Math problem from image', isUser: true, timestamp: new Date(), imageUri: manip.uri, extractedText: extracted }, { id: (Date.now()+1).toString(), text: r.answer, isUser: false, timestamp: new Date() }];
          setMessages(upd); await saveChat(upd);
        } catch { Alert.alert('Math error', 'Could not evaluate. Try the AI tutor.'); }
        return;
      }
      const upd = [...messages,
        { id: Date.now().toString(), text: 'Math problem from image', isUser: true, timestamp: new Date(), imageUri: manip.uri, extractedText: extracted },
        { id: (Date.now()+1).toString(), text: `🧮 Math Solver\nProblem: ${detection.originalLine}\n${solution.explanation}\n${solution.answer}\n${solution.latex}`, isUser: false, timestamp: new Date() },
      ];
      setMessages(upd); await saveChat(upd);
    } catch { Alert.alert('Error', 'Failed to solve. Try a clearer image.'); }
    finally { setLoading(false); }
  };

  const routeCapturedImage = async (task: CaptureTask, imageUri: string) => {
    if (task === 'ocr') { await openOcrCropper(imageUri); return; }
    await processMathImage(imageUri);
  };

  const handleScanText = async () => {
    setShowTools(false);
    const source = await askSource('Scan Text (OCR)', 'Choose source. Crop to the relevant section for best results.');
    if (!source) return;
    if (source === 'library') { const uri = await pickFromLibrary(); if (uri) routeCapturedImage('ocr', uri); return; }
    const opened = await openNativeCamera('ocr');
    if (!opened) { const uri = await captureWithImagePickerCamera(); if (uri) routeCapturedImage('ocr', uri); }
  };

  const handleMathScan = async () => {
    setShowTools(false);
    const source = await askSource('Solve Math Problem', 'Capture a math equation and let Shiksha AI solve it.');
    if (!source) return;
    if (source === 'library') { const uri = await pickFromLibrary(); if (uri) routeCapturedImage('math', uri); return; }
    const opened = await openNativeCamera('math');
    if (!opened) { const uri = await captureWithImagePickerCamera(); if (uri) routeCapturedImage('math', uri); }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || !cameraTask || cameraBusy) return;
    setCameraBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setCameraTask(null);
      if (photo?.uri) await routeCapturedImage(cameraTask, photo.uri);
    } catch { Alert.alert('Camera Error', 'Could not capture photo. Please try again.'); }
    finally { setCameraBusy(false); }
  };

  const startListening = async () => {
    setIsListening(true);
    try {
      await SpeechToTextService.startListening(text => { if (text) setInputText(text); }, err => console.error('Speech error:', err));
    } catch (e) { console.error('Speech error:', e); }
    finally { setIsListening(false); }
  };

  const handleNewChat = () => Alert.alert('New Conversation', 'Start fresh? Current history will be saved.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'New Chat', onPress: async () => { await clearCurrentChat(); setMessages([]); } },
  ]);

  const handleTutorialFinish = async () => {
    await AsyncStorage.setItem('hasSeenTutorial_v1', 'true');
    setShowTutorial(false);
  };

  const tutorialSteps: SpotlightStep[] = [
    { targetId: 'header-mode', title: 'Online & Offline Mode', description: 'Switch to offline mode in settings to use Shiksha AI without internet.' },
    { targetId: 'scan-btn', title: 'Extract Text', description: 'Use OCR to convert your handwritten or printed notes into editable text.' },
    { targetId: 'voice-btn', title: 'Talk to your Tutor', description: 'Use the mic to ask questions hands-free.' },
  ];

  const handleToolPress = (id: string) => {
    if (id === 'ocr')  { handleScanText(); return; }
    if (id === 'math') { handleMathScan(); return; }
    if (id === 'hist') { setShowTools(false); router.push('/history'); }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[S.root, { backgroundColor: theme.surface }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <Animated.View style={[S.header, { opacity: headerFade, backgroundColor: isDark ? '#0D1025' : '#FFFFFF', borderBottomColor: theme.border }]}>
        <TouchableOpacity style={S.hBack} onPress={() => router.push('/dashboard')}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={S.hCenter}>
          <LinearGradient
            colors={isDark ? ['#1C2040', '#131729'] : ['#EEF2FF', '#E0E7FF']}
            style={S.hBadge}
          >
            <Image source={OFFICIAL_LOGO} style={S.hLogo} resizeMode="contain" />
            <Text style={[S.hBadgeText, { color: theme.accent }]}>AI Tutor</Text>
          </LinearGradient>
          <View style={S.hModePill}>
            <View style={[S.hModeDot, { backgroundColor: offlineMode ? '#F59E0B' : '#10B981' }]} />
            <Text style={[S.hModeLabel, { color: theme.textMuted }]}>
              {offlineMode ? 'Offline' : 'Online'}
            </Text>
          </View>
        </View>

        <View style={S.hRight}>
          <TouchableOpacity style={[S.hBtn, { backgroundColor: theme.panel, borderColor: theme.border }]} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[S.hBtn, { backgroundColor: theme.panel, borderColor: theme.border }]} onPress={handleNewChat}>
            <Ionicons name="add" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ─── Chat / Empty state ────────────────────────────────────────── */}
        <Animated.View style={[{ flex: 1 }, { opacity: listFade }]}>
          {messages.length === 0 ? (
            <ScrollView contentContainerStyle={S.emptyWrap} showsVerticalScrollIndicator={false}>
              {/* Bot illustration */}
              <View style={S.emptyIllustration}>
                <LinearGradient
                  colors={isDark ? ['#1C2040', '#131729'] : ['#EEF2FF', '#E0E7FF']}
                  style={S.emptyIconBg}
                >
                  <Image source={OFFICIAL_LOGO} style={S.emptyLogo} resizeMode="contain" />
                </LinearGradient>
                <View style={[S.emptyPing, { borderColor: isDark ? '#818CF844' : '#6366F133' }]} />
              </View>

              <Text style={[S.emptyTitle, { color: theme.text }]}>Hi {userName}, I'm Shiksha! 👋</Text>
              <Text style={[S.emptySub, { color: theme.textMuted }]}>
                Your AI tutor is ready. Ask me anything — science, maths, history, or scan a problem.
              </Text>

              {/* Quick topic chips */}
              <View style={S.chipsContainer}>
                {QUICK_TOPICS.map(t => (
                  <TouchableOpacity
                    key={t.label}
                    style={[S.chip, { backgroundColor: theme.panel, borderColor: theme.border }]}
                    onPress={() => handleSend(t.query)}
                    activeOpacity={0.8}
                  >
                    <Text style={S.chipEmoji}>{t.emoji}</Text>
                    <Text style={[S.chipLabel, { color: theme.text }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={m => m.id}
              contentContainerStyle={S.messageList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => (
                <View>
                  {!item.isUser && (
                    <View style={S.aiLabel}>
                      <MaterialCommunityIcons name="robot-outline" size={12} color={theme.accent} />
                      <Text style={[S.aiLabelText, { color: theme.accent }]}>
                        {offlineMode ? 'On-Device Model' : 'Cloud Model'}
                      </Text>
                    </View>
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
            />
          )}
        </Animated.View>

        {/* ─── Typing indicator ─────────────────────────────────────────── */}
        {loading && (
          <View style={[S.typingBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <View style={[S.typingBubble, { backgroundColor: theme.panel, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="robot-outline" size={14} color={theme.accent} style={{ marginRight: 8 }} />
              <View style={S.typingDots}>
                {[typingDot1, typingDot2, typingDot3].map((dot, i) => (
                  <Animated.View
                    key={i}
                    style={[S.typingDot, { backgroundColor: theme.accent, transform: [{ translateY: dot }] }]}
                  />
                ))}
              </View>
              <Text style={[S.typingText, { color: theme.textMuted }]}>Thinking…</Text>
            </View>
          </View>
        )}

        {/* ─── Tools panel ──────────────────────────────────────────────── */}
        {showTools && (
          <Animated.View style={[S.toolsPanel, { backgroundColor: theme.panel, borderTopColor: theme.border, opacity: toolsFade, transform: [{ translateY: toolsSlide }] }]}>
            {TOOL_ITEMS.map(tool => (
              <TouchableOpacity
                key={tool.id}
                style={[S.toolItem, { borderColor: theme.border }]}
                onPress={() => handleToolPress(tool.id)}
                activeOpacity={0.8}
              >
                <View style={[S.toolIcon, { backgroundColor: `${tool.color}22` }]}>
                  <Ionicons name={tool.icon as any} size={20} color={tool.color} />
                </View>
                <Text style={[S.toolLabel, { color: theme.text }]}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* ─── Input bar ────────────────────────────────────────────────── */}
        <View style={[S.inputWrapper, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <View style={[S.inputRow, {
            backgroundColor: isDark ? '#0F1320' : '#FFFFFF',
            borderColor: inputFocused ? theme.accent : theme.border,
          }]}>
            {/* Tools toggle */}
            <TouchableOpacity
              style={[S.inputIconBtn, showTools && { backgroundColor: `${theme.accent}20` }]}
              onPress={() => setShowTools(p => !p)}
              id="scan-btn"
            >
              <Ionicons
                name={showTools ? 'close' : 'add-circle-outline'}
                size={22}
                color={showTools ? theme.accent : theme.textMuted}
              />
            </TouchableOpacity>

            {/* Text input */}
            <TextInput
              style={[S.input, { color: theme.text }]}
              placeholder="Ask Shiksha anything…"
              placeholderTextColor={theme.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              onFocus={() => { setInputFocused(true); setShowTools(false); }}
              onBlur={() => setInputFocused(false)}
            />

            {/* Mic / Send */}
            {inputText.trim() ? (
              <TouchableOpacity
                style={[S.sendBtn, { backgroundColor: theme.accent }]}
                onPress={() => handleSend()}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <Animated.View style={{ transform: [{ scale: micPulse }] }} id="voice-btn">
                <TouchableOpacity
                  style={[S.micBtn, isListening && { backgroundColor: '#EF444422', borderColor: '#EF4444' }]}
                  onPress={startListening}
                >
                  <Ionicons
                    name={isListening ? 'mic' : 'mic-outline'}
                    size={22}
                    color={isListening ? '#EF4444' : theme.textMuted}
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Overlays & modals ────────────────────────────────────────────── */}

      {/* Welcome splash */}
      <WelcomeSplash
        visible={showWelcome}
        onClose={() => { setShowWelcome(false); setShowTutorial(true); }}
      />

      {/* Native camera */}
      <Modal visible={!!cameraTask} animationType="slide" onRequestClose={() => setCameraTask(null)}>
        <View style={S.cameraRoot}>
          {CameraView ? (
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing={cameraFacing} />
          ) : (
            <View style={S.cameraUnavail}>
              <Text style={S.cameraUnavailText}>Camera unavailable on this device.</Text>
            </View>
          )}

          {/* Camera top bar */}
          <View style={S.camTopBar}>
            <TouchableOpacity style={S.camIconBtn} onPress={() => setCameraTask(null)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={S.camTaskPill}>
              <Text style={S.camTaskText}>{cameraTask === 'ocr' ? '📄 Scan Text' : '🧮 Math Solver'}</Text>
            </View>
            <TouchableOpacity style={S.camIconBtn} onPress={() => setCameraFacing(p => p === 'back' ? 'front' : 'back')}>
              <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Viewfinder frame */}
          <View style={S.viewfinderFrame}>
            <View style={[S.vfCorner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[S.vfCorner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
            <View style={[S.vfCorner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[S.vfCorner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
          </View>

          {/* Shutter */}
          <View style={S.camBottomBar}>
            <TouchableOpacity
              style={[S.shutter, cameraBusy && { opacity: 0.5 }]}
              onPress={handleTakePhoto}
              disabled={cameraBusy}
            >
              {cameraBusy
                ? <ActivityIndicator color="#6366F1" />
                : <View style={S.shutterInner} />
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OCR Cropper */}
      <Modal visible={showOcrCropper} animationType="slide" onRequestClose={closeOcrCropper}>
        <SafeAreaView style={[S.cropperRoot, { backgroundColor: isDark ? '#06070B' : '#FFFFFF' }]} edges={['top', 'bottom']}>
          <View style={[S.cropperHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity style={[S.cropperBtn, { backgroundColor: theme.panel }]} onPress={closeOcrCropper}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[S.cropperTitle, { color: theme.text }]}>Select OCR Area</Text>
              <Text style={[S.cropperHint, { color: theme.textMuted }]}>Drag to move · Pull corner to resize</Text>
            </View>
            <TouchableOpacity style={[S.cropperBtn, { backgroundColor: theme.panel }]} onPress={resetCropBox}>
              <Ionicons name="refresh" size={20} color={theme.accent} />
            </TouchableOpacity>
          </View>

          <View
            style={S.cropCanvas}
            onLayout={e => setCropperLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
          >
            {ocrCropImageUri && <Image source={{ uri: ocrCropImageUri }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />}
            <View
              style={[S.cropSelection, { left: cropBox.x, top: cropBox.y, width: cropBox.width, height: cropBox.height }]}
              {...cropPanResponder.panHandlers}
            >
              <Text style={S.cropMoveLabel}>Move</Text>
              <View style={S.cropResizeHandle} {...cropResizeResponder.panHandlers}>
                <Ionicons name="resize" size={13} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <View style={[S.cropFooter, { borderTopColor: theme.border }]}>
            <TouchableOpacity style={[S.cropCancelBtn, { borderColor: theme.border }]} onPress={closeOcrCropper}>
              <Text style={[S.cropCancelTxt, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.cropApplyBtn, { backgroundColor: theme.accent }]} onPress={applySelectedCropForOcr}>
              <Ionicons name="scan" size={16} color="#FFFFFF" />
              <Text style={S.cropApplyTxt}>Scan Selection</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Spotlight tutorial */}
      <SpotlightTutorial
        visible={showTutorial}
        steps={tutorialSteps}
        onFinish={handleTutorialFinish}
      />
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────
function createStyles(theme: AppTheme, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1 },

    // Header
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: 10,
      borderBottomWidth: 1,
    },
    hBack: { width: 36, height: 36, borderRadius: 11, backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border, justifyContent: 'center', alignItems: 'center' },
    hCenter: { flex: 1, alignItems: 'center', gap: 4 },
    hBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
    hLogo: { width: 16, height: 16, borderRadius: 4 },
    hBadgeText: { fontSize: 14, fontWeight: '800' },
    hModePill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    hModeDot: { width: 6, height: 6, borderRadius: 3 },
    hModeLabel: { fontSize: 11, fontWeight: '700' },
    hRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    hBtn: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

    // Empty state
    emptyWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 30 },
    emptyIllustration: { position: 'relative', marginBottom: 20 },
    emptyIconBg: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
    emptyLogo: { width: 84, height: 84, borderRadius: 20 },
    emptyPing: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 62, borderWidth: 2, opacity: 0.4 },
    emptyTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 10 },

    // Quick topic chips
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
    chipEmoji: { fontSize: 16 },
    chipLabel: { fontSize: 13, fontWeight: '700' },

    // Messages
    messageList: { padding: Spacing.lg, paddingBottom: Spacing.xl },
    aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14, marginBottom: -4, paddingHorizontal: 4 },
    aiLabelText: { fontSize: 11, fontWeight: '700' },

    // Typing indicator
    typingBar: { paddingHorizontal: Spacing.lg, paddingVertical: 8, borderTopWidth: 1 },
    typingBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, alignSelf: 'flex-start', gap: 4 },
    typingDots: { flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: 16 },
    typingDot: { width: 7, height: 7, borderRadius: 3.5 },
    typingText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },

    // Tools panel
    toolsPanel: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: Spacing.lg, borderTopWidth: 1 },
    toolItem: { alignItems: 'center', gap: 6, flex: 1, paddingVertical: 8, borderRadius: 14, borderWidth: 1, marginHorizontal: 4 },
    toolIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    toolLabel: { fontSize: 11, fontWeight: '700' },

    // Input
    inputWrapper: { paddingHorizontal: Spacing.lg, paddingVertical: 10, borderTopWidth: 1 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: 22, borderWidth: 1.5,
      paddingHorizontal: 10, minHeight: 52,
      shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    inputIconBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
    input: { flex: 1, fontSize: 15, paddingVertical: 8, maxHeight: 100 },
    sendBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
    micBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 6, borderWidth: 1, borderColor: 'transparent' },

    // Camera modal
    cameraRoot: { flex: 1, backgroundColor: '#000000' },
    cameraUnavail: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    cameraUnavailText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
    camTopBar: { position: 'absolute', top: 56, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    camIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
    camTaskPill: { backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
    camTaskText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    viewfinderFrame: { position: 'absolute', top: '20%', left: '10%', right: '10%', bottom: '25%', justifyContent: 'space-between' },
    vfCorner: { position: 'absolute', width: 24, height: 24, borderColor: '#34D399' },
    camBottomBar: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
    shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
    shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFF' },

    // OCR Cropper
    cropperRoot: { flex: 1 },
    cropperHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
    cropperBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cropperTitle: { fontSize: 16, fontWeight: '800' },
    cropperHint: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    cropCanvas: { flex: 1, margin: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
    cropSelection: { position: 'absolute', borderWidth: 2, borderColor: '#34D399', backgroundColor: 'rgba(52,211,153,0.12)', alignItems: 'center', justifyContent: 'center' },
    cropMoveLabel: { color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.45)', fontSize: 11, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    cropResizeHandle: { position: 'absolute', right: -12, bottom: -12, width: 30, height: 30, borderRadius: 15, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },
    cropFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 20, paddingTop: 12, borderTopWidth: 1 },
    cropCancelBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    cropCancelTxt: { fontSize: 14, fontWeight: '700' },
    cropApplyBtn: { flex: 2, height: 50, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    cropApplyTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  });
}
