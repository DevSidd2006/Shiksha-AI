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
import { sendQuestion, processDocument } from '@/services/api';
import { generateOfflineAnswer } from '@/services/offlineTutor';
import { detectMathExpression, solveMathDetection } from '@/services/mathSolver';
import { getOfflineMode, getPreferredLanguage } from '@/storage/settingsStore';
import { saveChat, getCurrentChat, clearCurrentChat } from '@/storage/chatStore';
import { ChatBubble } from '@/components/ChatBubble';
import { SpeechToTextService } from '@/services/speechToText';
import { OCRService } from '@/services/ocrService';
import { getProfile } from '@/storage/profileStore';
import { VisionLanguageService } from '@/services/visionLanguageService';
import * as ImageManipulator from 'expo-image-manipulator';
import { WelcomeSplash } from '@/components/WelcomeSplash';
import TutorBotIllustration from '@/components/illustrations/TutorBotIllustration';
import { SpotlightTutorial, SpotlightStep } from '@/components/SpotlightTutorial';
import { Colors, Fonts, Shadows, Spacing, BorderRadius } from '@/styles/designSystem';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  imageUri?: string;
  extractedText?: string;
}

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
  
  const flatListRef = useRef<FlatList>(null);

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
      return () => {};
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
      
      if (offlineMode) {
        responseText = await generateOfflineAnswer(text);
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

  const handleImagePick = async () => {
    const source = await new Promise<'camera' | 'library' | null>((resolve) => {
      Alert.alert(
        'Upload Image',
        'Choose a source',
        [
          { text: 'Camera', onPress: () => resolve('camera') },
          { text: 'Gallery', onPress: () => resolve('library') },
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        ]
      );
    });

    if (!source) return;

    const { status } = source === 'camera' 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', `We need access to your ${source === 'camera' ? 'camera' : 'gallery'}.`);
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

    if (!result.canceled) {
      handleSend('Please explain what is in this image:', result.assets[0].uri);
    }
  };

  const handleScanText = async () => {
    const source = await new Promise<'camera' | 'library' | null>((resolve) => {
      Alert.alert(
        'Scan Text (OCR)',
        'Choose a source. For best results, crop only the relevant paragraph after selection.',
        [
          { text: 'Camera', onPress: () => resolve('camera') },
          { text: 'Library', onPress: () => resolve('library') },
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        ]
      );
    });

    if (!source) return;

    const { status } = source === 'camera' 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to scan your documents.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

    if (!result.canceled) {
      setLoading(true);
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [
            // Optional: slight contrast boost or grayscaling if needed
            // ImageManipulator doesn't have direct bitonal yet, 
            // but we can ensure standard size/quality
          ],
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
                  setInputText(prev => prev ? `${prev}\n\n${ocrResult.text}` : ocrResult.text);
                }
              },
              {
                text: 'Optimize with AI',
                onPress: async () => {
                  setLoading(true);
                  try {
                    const result = await processDocument(ocrResult.text, 'correct');
                    setInputText(prev => prev ? `${prev}\n\n${result}` : result);
                  } finally {
                    setLoading(false);
                  }
                }
              }
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
    }
  };

  const handleMathProblemScan = async () => {
    const source = await new Promise<'camera' | 'library' | null>((resolve) => {
      Alert.alert(
        'Solve Math Problem',
        'Capture a math equation or expression and let Shiksha AI compute the answer.',
        [
          { text: 'Camera', onPress: () => resolve('camera') },
          { text: 'Library', onPress: () => resolve('library') },
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        ]
      );
    });

    if (!source) return;

    const { status } = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', `We need access to your ${source === 'camera' ? 'camera' : 'gallery'} to scan the math problem.`);
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

    if (!result.canceled) {
      setLoading(true);
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
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
          Alert.alert('Math error', 'The expression could not be evaluated automatically. Try a simpler expression or ask the AI tutor.');
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
    }
  };

  const startListening = async () => {
    setIsListening(true);
    try {
      const text = await SpeechToTextService.startListening();
      if (text) {
        setInputText(text);
      }
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
      
      {/* Modern Header */}
      <LinearGradient
        colors={INDIGO_GRADIENT as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.tutorInfo}>
            <View style={styles.tutorAvatar}>
              <FontAwesome5 name="robot" size={20} color={Colors.white} />
              <View style={[styles.statusIndicator, { backgroundColor: offlineMode ? '#FFD93D' : '#4CAF50' }]} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Shiksha AI Tutor</Text>
              <Text style={styles.headerStatus}>{offlineMode ? 'Running Locally' : 'Online • Ready'}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleNewChat} style={styles.headerBtn}>
              <MaterialIcons name="add-comment" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

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
                <LinearGradient
                  colors={['#EEF2FF', '#E0E7FF']}
                  style={styles.heroIconBg}
                >
                  <TutorBotIllustration width={60} height={60} />
                </LinearGradient>
              </View>
              <Text style={styles.welcomeTitle}>Hello, {userName}! 👋</Text>
              <Text style={styles.welcomeSubtitle}>
                I'm your AI Tutor. Ask me anything about your Science, Math, or History chapters!
              </Text>
            </View>

            <View style={styles.quickTopicsTitleRow}>
              <Text style={styles.quickTopicsTitle}>Quick Topics</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.quickTopicsContainer}>
              {QUICK_TOPICS.map((topic, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.topicCard}
                  onPress={() => handleSend(topic.query)}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicEmojiContainer}>
                    <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                  </View>
                  <Text style={styles.topicLabel}>{topic.label}</Text>
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
              <ChatBubble 
                text={item.text}
                isUser={item.isUser}
                timestamp={item.timestamp}
                imageUri={item.imageUri}
                extractedText={item.extractedText}
                preferredLanguage={preferredLanguage}
              />
            )}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TouchableOpacity 
              onPress={handleImagePick} 
              style={styles.mediaBtn}
              id="attach-btn"
            >
              <Ionicons name="camera-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleScanText} 
              style={styles.mediaBtn}
              id="scan-btn"
            >
              <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleMathProblemScan} 
              style={styles.mediaBtn}
              id="math-btn"
            >
              <Ionicons name="calculator-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Type your question..."
              placeholderTextColor={Colors.gray400}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            
            <TouchableOpacity 
              onPress={startListening} 
              style={styles.mediaBtn}
              id="voice-btn"
            >
              <Ionicons 
                name={isListening ? "mic" : "mic-outline"} 
                size={24} 
                color={isListening ? Colors.error : Colors.primary} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={loading || (!inputText.trim() && !isListening)}
              style={styles.sendBtnModern}
            >
              <LinearGradient
                colors={INDIGO_GRADIENT as any}
                style={styles.sendBtnGradient}
              >
                <MaterialIcons name="send" size={20} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tutorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    padding: 20,
    paddingBottom: 10,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  quickTopicsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  quickTopicsTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray200,
  },
  quickTopicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  topicCard: {
    width: (width - 74) / 2,
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  topicEmojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicEmoji: {
    fontSize: 20,
  },
  topicLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.gray800,
  },
  loadingContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: Colors.gray500,
    fontSize: 12,
  },
  inputWrapper: {
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 5 : 15,
    backgroundColor: Colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray900,
    maxHeight: 120,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  mediaBtn: {
    padding: 8,
  },
  sendBtnModern: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendBtnGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
