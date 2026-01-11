# 🎓 Siksha AI - India's First Fully offline Personal AI Tutor

A comprehensive AI-powered learning platform built with React Native and Expo that provides personalized tutoring, interactive quizzes, flashcards, and progress tracking for students.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-React%20Native-blue)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Authentication](#-authentication)
- [Onboarding](#-onboarding)
- [Features Guide](#-features-guide)
- [API Integration](#-api-integration)
- [Offline Mode](#-offline-mode)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🤖 AI Tutor
- **Intelligent Q&A System** - Ask any question and get instant, detailed explanations
- **Image Analysis** - Upload images of problems or notes for AI analysis using vision models
- **Voice Input** - Ask questions using voice recognition (web browsers)
- **Text-to-Speech** - Listen to AI responses with natural speech synthesis
- **Offline Support** - Get answers even without internet connection
- **Chat History** - Access previous conversations and learning history

### 📚 Flashcards
- **Interactive Learning** - Create and study with digital flashcards
- **Spaced Repetition** - Optimized learning algorithm for better retention
- **Progress Tracking** - Monitor your flashcard mastery
- **Multiple Subjects** - Organized by subject and topic

### 📝 Quiz System
- **Adaptive Quizzes** - Questions adjust to your skill level
- **Instant Feedback** - Get immediate explanations for answers
- **Performance Analytics** - Detailed breakdown of your performance
- **Multiple Question Types** - Multiple choice, true/false, and more

### 📊 Progress Dashboard
- **Learning Analytics** - Visual representation of your progress
- **Study Streaks** - Track consecutive days of learning
- **Performance Metrics** - Detailed statistics on quiz scores and accuracy
- **Goal Tracking** - Set and monitor weekly learning goals
- **Time Tracking** - Monitor total study time

### 👤 User Profile
- **Personalization** - Customize learning preferences
- **Grade Selection** - Choose your academic level
- **Subject Preferences** - Select favorite subjects
- **Learning Style** - Choose your preferred learning method (Visual, Auditory, Reading, Kinesthetic)
- **Weekly Goals** - Set study time targets

### 🎯 Interactive Onboarding
- **Welcome Splash** - Animated introduction on first launch
- **Spotlight Tutorial** - Interactive guide highlighting key features
- **Reset Option** - Restart tutorial anytime

---

## 🛠 Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build service
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation and routing
- **Expo Router** - File-based routing

### State Management & Storage
- **AsyncStorage** - Local data persistence
- **React Hooks** - State management
- **Custom Stores** - Modular data management

### UI & Styling
- **React Native StyleSheet** - Native styling
- **Animated API** - Smooth animations
- **Safe Area Context** - Safe area handling

### Services & APIs
- **Ollama** - Local LLM inference
- **Vision Models** - Image analysis (Qwen3-VL)
- **Speech Recognition** - Voice input (Web)
- **Text-to-Speech** - Voice output

### Backend
- **Node.js** - Server runtime
- **Express** - Web framework
- **Environment Variables** - Configuration management

---

## 📁 Project Structure

```
siksha-ai/
├── app/
│   ├── index.tsx                 # Entry point with auth check
│   └── (tabs)/
│       ├── _layout.tsx           # Tab navigation layout
│       ├── tutor.tsx             # AI Tutor screen
│       ├── flashcards.tsx        # Flashcards screen
│       ├── quiz.tsx              # Quiz screen
│       ├── progress.tsx          # Progress dashboard
│       ├── dashboard.tsx         # Main dashboard
│       ├── notes.tsx             # Study notes
│       ├── history.tsx           # Chat history
│       ├── profile.tsx           # User profile
│       └── settings.tsx          # App settings
│
├── src/
│   ├── components/
│   │   ├── AuthScreen.tsx        # Login/signup UI
│   │   ├── WelcomeSplash.tsx     # Welcome animation
│   │   ├── SpotlightTutorial.tsx # Interactive tutorial
│   │   └── ChatBubble.tsx        # Chat message component
│   │
│   ├── services/
│   │   ├── api.ts                # API calls
│   │   ├── ocrService.ts         # OCR functionality
│   │   ├── visionService.ts      # Vision model service
│   │   ├── speechToText.ts       # Speech recognition
│   │   └── offlineTutor.ts       # Offline AI responses
│   │
│   ├── storage/
│   │   ├── authstore.ts          # Authentication logic
│   │   ├── chatStore.ts          # Chat history storage
│   │   ├── profileStore.ts       # User profile storage
│   │   └── settingsStore.ts      # App settings storage
│   │
│   ├── data/
│   │   ├── class9Science.ts      # Science curriculum data
│   │   ├── class9ScienceQuiz.ts  # Science quiz questions
│   │   ├── class9ScienceNotes.ts # Science study notes
│   │   └── studyProgress.ts      # Progress tracking data
│   │
│   └── styles/
│       └── designSystem.ts       # Design tokens and colors
│
├── backend/
│   ├── .env                      # Backend configuration
│   └── [backend files]
│
├── app.json                      # Expo configuration
├── tsconfig.json                 # TypeScript configuration
├── babel.config.js               # Babel configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI** - `npm install -g expo-cli`
- **Ollama** (for local AI inference) - [Download](https://ollama.ai)

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/siksha-ai.git
cd siksha-ai
```

### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
```

### Step 3: Setup Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_OLLAMA_URL=http://localhost:11434
```

### Step 4: Start Ollama (for AI features)
```bash
# Start Ollama service
ollama serve

# In another terminal, pull the vision model
ollama pull qwen3-vl:2b
```

### Step 5: Start the Development Server
```bash
npm start
# or
expo start
```

### Step 6: Run on Device/Emulator
- **iOS**: Press `i` in the terminal
- **Android**: Press `a` in the terminal
- **Web**: Press `w` in the terminal

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in the root directory:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_OLLAMA_URL=http://localhost:11434

# Feature Flags
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true
EXPO_PUBLIC_ENABLE_VISION_MODEL=true
EXPO_PUBLIC_ENABLE_SPEECH=true
```

### Ollama Setup

1. **Install Ollama** from [ollama.ai](https://ollama.ai)

2. **Pull Required Models**:
```bash
# Vision model for image analysis
ollama pull qwen3-vl:2b

# LLM for text generation
ollama pull mistral
```

3. **Verify Installation**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags
```

### Backend Configuration

Create `backend/.env`:
```env
PORT=3000
NODE_ENV=development
OLLAMA_URL=http://localhost:11434
```

---

## 📱 Usage

### First Time Setup

1. **Launch App** - App starts at `app/index.tsx`
2. **Authentication Check** - Checks if user is logged in
3. **Login/Register** - If not authenticated, shows `AuthScreen`
4. **Welcome Splash** - Animated introduction screen
5. **Interactive Tutorial** - 6-step guided tour of features
6. **Start Learning** - Ready to use the app

### Main Features

#### 🤖 AI Tutor
```
1. Go to "Ask Your Doubt" tab
2. Type your question or use voice input
3. Optionally upload an image for analysis
4. Click "Send" to get AI response
5. Listen to response with text-to-speech
6. Start a new chat anytime
```

#### 📚 Flashcards
```
1. Go to "Flashcards" tab
2. Select a subject or topic
3. Study cards with spaced repetition
4. Mark cards as known/unknown
5. Track your progress
```

#### 📝 Quiz
```
1. Go to "Quiz" tab
2. Select a subject
3. Answer questions
4. Get instant feedback
5. View detailed results
```

#### 📊 Progress
```
1. Go to "Progress" tab
2. View learning analytics
3. Check study streaks
4. Monitor quiz performance
5. Track weekly goals
```

#### 👤 Profile
```
1. Go to "Profile" tab
2. Update personal information
3. Select grade and subjects
4. Choose learning style
5. Set weekly goals
6. Click "Logout" to exit
```

---

## 🔐 Authentication

### How It Works

1. **User Registration**
   - User enters email, password, and name
   - Data validated and stored in AsyncStorage
   - User automatically logged in

2. **User Login**
   - User enters email and password
   - Credentials verified against stored users
   - Session created and stored in AsyncStorage

3. **Session Management**
   - Session stored in `@siksha_auth` key
   - Checked on app startup
   - Persists across app restarts

4. **Logout**
   - Session cleared from AsyncStorage
   - User redirected to login screen
   - All user data remains (can login again)

### AsyncStorage Keys

```typescript
// Authentication
@siksha_auth       // Current user session
@siksha_users      // All registered users

// Onboarding
hasSeenTutorial_v1 // Tutorial completion flag

// User Data
@siksha_profile    // User profile information
@siksha_chat       // Chat history
@siksha_settings   // App settings
```

### Security Notes

⚠️ **Development Only**: Passwords are stored in plain text for development. In production:
- Use secure authentication (Firebase, Auth0, etc.)
- Hash passwords with bcrypt
- Use JWT tokens
- Implement refresh tokens
- Use HTTPS only

---

## 🎓 Onboarding

### Welcome Splash
- **Duration**: 3.5 seconds
- **Animation**: Rotating logo with pulse effect
- **Content**: App name, tagline, and features
- **Trigger**: Shows on first app launch

### Spotlight Tutorial
- **Steps**: 6 interactive steps
- **Duration**: User-controlled
- **Features**: Spotlight effect, progress bar, tooltips
- **Steps**:
  1. Welcome message
  2. Ask questions explanation
  3. Upload images feature
  4. Send button usage
  5. Voice input option
  6. Final encouragement

### Reset Tutorial
- **Location**: 🔄 button in tutor screen header
- **Effect**: Clears tutorial flag and restarts onboarding
- **Use Case**: Help users re-learn features

---

## 🎯 Features Guide

### AI Tutor Features

#### Text Questions
```typescript
// User asks a question
const question = "What is photosynthesis?";

// AI generates response
const response = await sendQuestion(question, studentGrade);

// Response displayed in chat
```

#### Image Analysis
```typescript
// User uploads image
const imageUri = "file:///path/to/image.jpg";

// Vision model analyzes image
const result = await VisionLanguageService.processImageWithQuestion(
  imageUri,
  "Explain this problem"
);

// Result displayed with explanation
```

#### Voice Input
```typescript
// User clicks microphone
SpeechToTextService.startListening(
  (transcript) => {
    // Update input with transcript
  },
  (error) => {
    // Handle error
  }
);
```

#### Text-to-Speech
```typescript
// User clicks speaker icon
await SpeechToTextService.speak(
  responseText,
  'en-IN',
  () => {
    // Callback when done
  }
);
```

### Offline Mode

#### Enabling Offline Mode
```typescript
// In Settings screen
await updateOfflineMode(true);

// Tutor will use offline responses
const response = await generateOfflineAnswer(question);
```

#### Offline Responses
- Pre-generated answers for common questions
- No internet connection required
- Limited but functional

---

## 🔌 API Integration

### Backend API Endpoints

#### Send Question
```
POST /api/question
Body: { question: string, grade: string }
Response: { answer: string, sources?: string[] }
```

#### Get Chat History
```
GET /api/chat/:userId
Response: { messages: Message[] }
```

#### Save Chat
```
POST /api/chat
Body: { userId: string, messages: Message[] }
Response: { success: boolean }
```

### Vision Model Integration

#### Check Ollama Status
```typescript
const available = await VisionLanguageService.isOllamaAvailable();
```

#### Process Image
```typescript
const result = await VisionLanguageService.processImageWithQuestion(
  imageUri,
  question
);
// Returns: { answer: string, processingTime: number, model: string }
```

---

## 🌐 Offline Mode

### Features
- ✅ Answer common questions
- ✅ Access stored chat history
- ✅ View flashcards
- ✅ Take quizzes
- ❌ Real-time AI responses
- ❌ Image analysis
- ❌ Voice features

### Enabling Offline Mode
```typescript
// In Settings
await updateOfflineMode(true);

// Check status
const isOffline = await getOfflineMode();
```

### Offline Responses
```typescript
// Tutor screen automatically uses offline mode
const response = await generateOfflineAnswer(question);
```

---

## 💻 Development

### Running Development Server
```bash
npm start
# or
expo start
```

### Building for Production

#### iOS
```bash
eas build --platform ios
```

#### Android
```bash
eas build --platform android
```

#### Web
```bash
npm run web
```

### Testing

#### Run Tests
```bash
npm test
```

#### Test Authentication
```bash
# Clear storage
await AsyncStorage.clear();

# Restart app - should show AuthScreen
```

#### Test Onboarding
```bash
# After login, check tutorial flag
const seen = await AsyncStorage.getItem('hasSeenTutorial_v1');
console.log('Tutorial seen:', seen);
```

### Code Quality

#### TypeScript Checking
```bash
npx tsc --noEmit
```

#### Linting
```bash
npm run lint
```

#### Formatting
```bash
npm run format
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. AuthScreen Not Showing
**Problem**: App goes directly to tutor screen without login
```typescript
// Solution: Clear AsyncStorage
await AsyncStorage.clear();
// Restart app
```

#### 2. Ollama Connection Error
**Problem**: Vision model not working
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if not running
ollama serve

# Pull vision model
ollama pull qwen3-vl:2b
```

#### 3. Tutorial Not Showing
**Problem**: Welcome splash and tutorial don't appear
```typescript
// Solution: Reset tutorial
await AsyncStorage.removeItem('hasSeenTutorial_v1');
// Restart app
```

#### 4. Chat History Not Saving
**Problem**: Messages disappear after app restart
```typescript
// Check AsyncStorage
const chat = await AsyncStorage.getItem('@siksha_chat');
console.log('Chat:', chat);

// Clear and restart
await AsyncStorage.removeItem('@siksha_chat');
```

#### 5. Voice Input Not Working
**Problem**: Microphone button doesn't work
```
Note: Voice input only works on web browsers (Chrome, Edge, Safari)
Mobile platforms require different implementation
```

### Debug Mode

Enable debug logging:
```typescript
// In any component
console.log('Debug:', data);

// Check AsyncStorage
const keys = await AsyncStorage.getAllKeys();
console.log('Storage keys:', keys);
```

### Getting Help

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review error messages in console
3. Check AsyncStorage contents
4. Review component props and state
5. Check network connectivity

---

## 📚 Documentation Files

- **ONBOARDING_AUTH_REFERENCE.md** - Authentication and onboarding details
- **CONNECTIONS_IMPLEMENTED.md** - File connections and integration
- **INTEGRATION_VERIFICATION.md** - Testing and verification guide
- **ARCHITECTURE.md** - System architecture overview

---

## 🤝 Contributing

### How to Contribute

1. **Fork the Repository**
```bash
git clone https://github.com/yourusername/siksha-ai.git
```

2. **Create a Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make Changes**
- Follow the existing code style
- Add TypeScript types
- Write clear commit messages

4. **Test Your Changes**
```bash
npm test
npm run lint
```

5. **Submit a Pull Request**
- Describe your changes
- Reference any related issues
- Wait for review

### Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Add comments for complex logic
- Keep components small and focused

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Team

- **Project Lead**: [Siddhartha Kushwaha]
- **Developers**: [Anand Nair, Krishna Marathe]
- **Designers**: [Krushna Boinwad]

---

## 🙏 Acknowledgments

- React Native and Expo communities
- Ollama for local LLM inference
- All contributors and testers

---

## 📞 Support

### Getting Help

- **Documentation**: Check README and guide files
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join community discussions
- **Email**: support@siksha-ai.com

### Useful Links

- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [Ollama Docs](https://github.com/ollama/ollama)
- [TypeScript Docs](https://www.typescriptlang.org)

---

## 🚀 Roadmap

### Version 1.1
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Collaborative learning
- [ ] Mobile app optimization

### Version 1.2
- [ ] AI-generated practice problems
- [ ] Peer tutoring features
- [ ] Advanced progress tracking
- [ ] Gamification elements

### Version 2.0
- [ ] Web platform
- [ ] Teacher dashboard
- [ ] Curriculum customization
- [ ] Advanced AI features

---

## 📊 Project Statistics

- **Total Files**: 50+
- **Lines of Code**: 10,000+
- **Components**: 20+
- **Screens**: 9
- **Features**: 15+

---

## ✅ Checklist for First-Time Users

- [ ] Install Node.js and npm
- [ ] Clone the repository
- [ ] Install dependencies with `npm install`
- [ ] Setup environment variables in `.env`
- [ ] Install and start Ollama
- [ ] Pull vision model with `ollama pull qwen3-vl:2b`
- [ ] Start dev server with `npm start`
- [ ] Run on device/emulator
- [ ] Create account and login
- [ ] Complete onboarding tutorial
- [ ] Try AI tutor feature
- [ ] Explore other features

---

## 📝 Version History

### v1.0.0 (Current)
- Initial release
- Authentication system
- AI tutor with image analysis
- Flashcards and quizzes
- Progress tracking
- Interactive onboarding
- Offline mode support

---

**Last Updated**: January 2026
**Status**: Production Ready ✅

For more information, visit the [project repository](https://github.com/yourusername/siksha-ai)
