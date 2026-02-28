import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendQuestion, processDocument } from '@/features/ai';
import { generateOfflineAnswer } from '@/features/ai';
import { detectMathExpression, solveMathDetection } from '@/features/ai';
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
import { Colors, Fonts, Shadows, Spacing, BorderRadius } from '@/shared';

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

const INDIGO_GRADIENT = ['#6366F1', '#4F46E5'];

const QUICK_TOPICS = [
  { label: "Newton's Laws", emoji: '🍎', query: "Explain Newton's Three Laws of Motion with examples." },
  { label: 'Cell Structure', emoji: '🧫', query: 'What are the main parts of a plant and animal cell?' },
  { label: 'Quadratic Eq', emoji: '📐', query: 'How to solve quadratic equations using the formula?' },
  { label: 'French Revolution', emoji: '🇫🇷', query: 'What were the main causes of the French Revolution?' },
  { label: 'Tenses', emoji: '📝', query: 'Explain the difference between Present Perfect and Past Simple.' },
];

export default function TutorScreen() {
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

  const flatListRef = useRef<FlatList>(null);
  const cameraRef = useRef<any>(null);

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
        const response = await generateOfflineAnswer(text);
        responseText = response.answer;
        if ((response as any).tokensPerSec) tps = (response as any).tokensPerSec;
      } else {
        if (imageUri) {
          responseText = await VisionLanguageService.analyzeImage(imageUri, text || 'Explain this image');
        } else {
          const response = await sendQuestion(text);
          responseText = response.answer;
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

  const processOcrImage = async (imageUri: string) => {
    setLoading(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const ocrResult = await OCRService.extractTextFromImage(manipulated.uri);
      if (ocrResult.text) {
        Alert.alert(
          'Text Scanned',
          'Would you like to optimize this text (fix OCR errors) using AI?',
          [
            {
              text: 'Raw Text',
              onPress: () => {
                setInputText((prev) => (prev ? `${prev}\n\n${ocrResult.text}` : ocrResult.text));
              },
            },
            {
              text: 'Optimize with AI',
              onPress: async () => {
                setLoading(true);
                try {
                  const result = await processDocument(ocrResult.text, 'correct');
                  setInputText((prev) => (prev ? `${prev}\n\n${result}` : result));
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('OCR Result', 'No text could be extracted. Try cropping closer to the text.');
      }
    } catch (error) {
      console.error('OCR error:', error);
      Alert.alert('Error', 'Failed to scan text. Make sure the text is clear and readable.');
    } finally {
      setLoading(false);
    }
  };

  const processMathImage = async (imageUri: string) => {
    setLoading(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const ocrResult = await OCRService.extractTextFromImage(manipulated.uri);
      const detection = detectMathExpression(ocrResult.text);

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
          const aiResponse = await sendQuestion(`Solve and explain this math problem Step-by-Step: ${ocrResult.text}`);
          const userMsg: Message = {
            id: Date.now().toString(),
            text: 'Math problem from image (Algebraic)',
            isUser: true,
            timestamp: new Date(),
            imageUri: manipulated.uri,
            extractedText: ocrResult.text,
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
        extractedText: ocrResult.text,
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
      await processOcrImage(imageUri);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Screenshot-style Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { }} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.askImageBadge}>
            <Ionicons name="image" size={14} color={Colors.white} style={{ marginRight: 4 }} />
            <Text style={styles.headerTitleText}>Ask Image</Text>
          </View>
          <TouchableOpacity style={styles.modelSelector}>
            <Text style={styles.modelSelectorText}>Gemma-E2B-it</Text>
            <Ionicons name="chevron-down" size={12} color={Colors.gray200} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="options-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerAction, styles.plusBtnCircle]}>
            <Ionicons name="add" size={22} color={Colors.white} />
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
                  <TutorBotIllustration width={80} height={80} />
                </View>
              </View>
              <Text style={styles.welcomeTitle}>New Session</Text>
              <Text style={styles.welcomeSubtitle}>
                Type a message or upload an image to start learning with Shiksha AI.
              </Text>
            </View>

            <View style={styles.quickTopicsContainer}>
              {QUICK_TOPICS.map((topic, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.topicCard}
                  onPress={() => handleSend(topic.query)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.topicLabel}>{topic.emoji} {topic.label}</Text>
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
                  <Text style={styles.modelPlatformLabel}>Model on CPU</Text>
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
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              onPress={handleImagePick}
              style={styles.plusBtn}
            >
              <Ionicons name="add" size={28} color={Colors.gray200} />
            </TouchableOpacity>

            <TextInput
              style={styles.inputField}
              placeholder="Type prompt..."
              placeholderTextColor={Colors.gray400}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />

            {!inputText.trim() && (
              <TouchableOpacity onPress={startListening} style={styles.micBtn}>
                <Ionicons name="mic-outline" size={24} color={Colors.gray200} />
              </TouchableOpacity>
            )}

            {inputText.trim() ? (
              <TouchableOpacity
                onPress={() => handleSend()}
                disabled={loading}
                style={styles.sendIconBtn}
              >
                <Ionicons name="send" size={20} color={Colors.gray200} />
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
});
