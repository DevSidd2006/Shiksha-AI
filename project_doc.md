# Shiksha AI - Project Documentation

## 1. What Is Project Documentation?
Project documentation is the complete written record of a software project: what problem it solves, how it is designed, how to run it, how each module works, what assumptions it makes, and how to maintain or extend it. Good documentation allows evaluators, developers, and stakeholders to quickly understand the system without reverse-engineering the code.

For this project, documentation covers:
- Product purpose and scope
- Technical architecture and data flows
- Setup and run instructions
- API contracts and storage model
- Native module integrations
- Known limitations and future improvements

---

## 2. Project Overview

### 2.1 Project Name
Shiksha AI

### 2.2 Problem Statement
Many AI learning tools require reliable internet, paid APIs, and English-only interfaces. This creates barriers for students in low-connectivity regions.

### 2.3 Solution
Shiksha AI is an offline-first React Native tutoring app focused on Class 9/10 learners. It supports:
- AI chat tutoring
- OCR-based text extraction from images
- Vision-based question answering from images
- Math expression detection and solving
- Local chat history and settings persistence
- Native Android speech-to-text integration for voice input

### 2.4 Target Users
- School students (primarily Class 9/10)
- Students in low-connectivity zones
- Learners requiring multilingual support

---

## 3. High-Level Architecture

### 3.1 Main Components
1. Mobile App (React Native + Expo Router)
2. Local Storage Layer (Expo SQLite)
3. Backend Service (Node.js + Express)
4. Local AI Runtime (Ollama)
5. Native Android Modules
   - LlamaBridge (on-device inference hook)
   - NativeSpeechToText (Android SpeechRecognizer)

### 3.2 Architecture Style
- Client-heavy, offline-first mobile architecture
- Backend used for AI proxy/OCR/vision tasks
- Native bridges for device-level capabilities

---

## 4. Technology Stack

### 4.1 Mobile (Frontend)
- React Native
- Expo SDK 54
- Expo Router
- TypeScript
- Expo SQLite
- Expo Image Picker / Image Manipulator
- Expo Speech (TTS)
- Optional Expo Camera runtime integration (with fallback)

### 4.2 Backend
- Node.js
- Express
- Axios
- Tesseract.js (OCR)
- Optional Python translation service (`translator_service.py`)

### 4.3 AI Layer
- Ollama endpoint (`/api/generate`)
- Default configured model: `qwen2.5:1.5b`
- Optional on-device LLM through native `LlamaBridge`

### 4.4 Native Android
- Kotlin modules in `android/app/src/main/java/com/siksha/ai`
- `SpeechToTextModule` using Android `SpeechRecognizer`

---

## 5. Repository Structure

```text
app/
  _layout.tsx
  index.tsx
  (tabs)/
    dashboard.tsx
    tutor.tsx
    flashcards.tsx
    quiz.tsx
    notes.tsx
    progress.tsx
    history.tsx
    settings.tsx
    profile.tsx

src/
  components/
  data/
  database/
    init.ts
  services/
    api.ts
    offlineTutor.ts
    speechToText.ts
    ocrService.ts
    visionLanguageService.ts
    mathSolver.ts
    nativeLlama.ts
  storage/
    chatStore.ts
    settingsStore.ts
    profileStore.ts
    authStore.ts

backend/
  server.js
  translator_service.py
  eng.traineddata
  hin.traineddata

android/
  app/src/main/java/com/siksha/ai/
    LlamaBridgeModule.kt
    LlamaBridgePackage.kt
    SpeechToTextModule.kt
    SpeechToTextPackage.kt
    MainApplication.kt
```

---

## 6. Core Functional Flows

### 6.1 AI Tutor Chat
1. User sends message from `app/(tabs)/tutor.tsx`
2. Message saved in local state
3. If offline mode:
   - `generateOfflineAnswer()` is called
   - If native model path is configured, tries `LlamaBridge`
   - Else returns structured local guidance fallback
4. If online mode:
   - Calls backend `/tutor`
5. AI response appended
6. Entire chat persisted to SQLite via `src/storage/chatStore.ts`

### 6.2 Image Vision Flow
1. User captures/selects image
2. Image routed to `VisionLanguageService.analyzeImage()`
3. Base64 sent to backend `/vision`
4. Backend forwards to Ollama model
5. Response shown in chat

### 6.3 OCR Flow
1. User captures/selects image
2. `OCRService.extractTextFromImage()` sends base64 to backend `/ocr`
3. Tesseract extracts text
4. App can:
   - Insert raw text into input, or
   - Send text to `/process-document` with `correct` task

### 6.4 Math Scan Flow
1. OCR text extracted from captured image
2. `detectMathExpression()` finds equation/expression
3. `solveMathDetection()` solves locally when possible
4. If local solve fails, fallback to AI tutor explanation via `/tutor`

### 6.5 Voice Input (Native Android STT)
1. User taps mic button in tutor
2. `SpeechToTextService.startListening()`
3. On Android, invokes native module `NativeSpeechToText`
4. Native `SpeechRecognizer` emits partial/final transcripts
5. Transcript inserted into chat input field

---

## 7. Data and Persistence Model

### 7.1 SQLite Tables
Defined in `src/database/init.ts`:
- `users`
- `chats`
- `messages`
- `progress`
- `achievements`
- `settings`
- `cached_responses`
- `sync_queue`
- `app_meta`

### 7.2 Current Practical Storage Split
- SQLite: chat and settings are integrated and actively used
- AsyncStorage: auth/profile and some onboarding flags still used

### 7.3 Chat Persistence Strategy
`src/storage/chatStore.ts` stores:
- Current chat id in `app_meta`
- Messages in `messages` table
- Chat metadata in `chats` table

---

## 8. Backend API Documentation

Base URL:
- Dev: `http://<host>:3000`
- Android emulator fallback: `http://10.0.2.2:3000`

### 8.1 `GET /`
Health endpoint.

### 8.2 `POST /tutor`
Request:
```json
{ "question": "...", "studentGrade": "Class 9" }
```
Response:
```json
{ "answer": "...", "model": "...", "source": "ollama", "timestamp": "..." }
```

### 8.3 `POST /process-document`
Tasks: `correct | summarize | qa | extract`

### 8.4 `POST /translate`
Request:
```json
{ "text": "...", "targetLang": "hin_Deva" }
```

### 8.5 `POST /vision`
Request contains base64 image and optional question.

### 8.6 `POST /ocr`
Request:
```json
{ "image": "<base64>" }
```
Response:
```json
{ "text": "...", "confidence": 0.8, "language": "eng+hin", "words": 123 }
```

---

## 9. Native Android Modules

### 9.1 LlamaBridge
Files:
- `LlamaBridgeModule.kt`
- `LlamaBridgePackage.kt`
- C++ bridge in `android/app/src/main/cpp`

Purpose:
- Enable on-device text generation when a GGUF model path is configured.

### 9.2 NativeSpeechToText
Files:
- `SpeechToTextModule.kt`
- `SpeechToTextPackage.kt`

Purpose:
- Use Android `SpeechRecognizer` for chat microphone input.

Events emitted to JS:
- `NativeSpeechToTextResult`
- `NativeSpeechToTextError`
- `NativeSpeechToTextEnd`

---

## 10. Environment Configuration

### 10.1 Root `.env`
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
EXPO_PUBLIC_LLAMA_MODEL_PATH=/absolute/path/to/model.gguf
```

### 10.2 Backend `.env`
```env
PORT=3000
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:1.5b
TRANSLATOR_SERVICE_URL=http://localhost:3001
```

---

## 11. Build and Run Guide (Android Native Only)

### 11.1 Prerequisites
- Node.js + npm
- Android Studio + SDK
- Java JDK (`JAVA_HOME` set)
- Android emulator/device running
- Ollama (if using backend AI endpoints)

### 11.2 Install Dependencies
If you encounter peer dependency conflicts (e.g., React version mismatches), use the legacy flag:
```bash
npm install --legacy-peer-deps
cd backend && npm install && cd ..
```

### 11.3 Start Backend
```bash
cd backend
node server.js
```

### 11.4 Build Native Android App (Local)
Ensure you have the Android SDK installed and `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) set in your environment variables. `adb` must also be available in your `PATH`.
```bash
npx expo run:android
```

### 11.5 Build Standalone APK (EAS)
To build a standalone APK without a local Android toolchain, use Expo Application Services:
```bash
npx eas build -p android --profile preview
```
**Troubleshooting Project Access**: If you see "Project ID not accessible", ensure you are logged into the correct account:
```bash
npx eas logout
npx eas login
```

### 11.6 Start Metro (offline-safe)
```bash
EXPO_OFFLINE=1 EXPO_NO_DEPENDENCY_VALIDATION=1 npx expo start --dev-client --offline
```

---

## 12. Permissions

### Android
- `CAMERA`
- `RECORD_AUDIO`
- `INTERNET`

### iOS
- `NSCameraUsageDescription`
- `NSMicrophoneUsageDescription`
- `NSSpeechRecognitionUsageDescription`

---

## 13. Security and Privacy Notes

- Chat and learning data are stored locally on device.
- API keys should remain in backend `.env`, never bundled in app code.
- Large base64 payload endpoints should be protected in production (auth + rate limits).
- User password storage in current auth store is plaintext (needs hashing for production).

---

## 14. Known Limitations

1. Full project type-check currently has unrelated design-system typing errors in `quiz.tsx`.
2. Native Android compile validation may fail on machines without `JAVA_HOME` configured.
3. Some persistence domains still mixed between SQLite and AsyncStorage.
4. `expo-camera` installation can fail in network-restricted environments; app currently has fallback camera path.

---

## 15. Native Troubleshooting and Technical Notes

### 15.1 Model Download (Kotlin Bridge Error)
Users might encounter a `downloadResumableStartAsync: Cannot convert 'null' to a Kotlin type` error on some Android versions.
- **Root Cause**: Expo's `createDownloadResumable` can fail in the JNI bridge if parameters like headers are not explicitly provided.
- **Fix**: Use `FileSystem.downloadAsync` with explicit `{ headers: {} }`. This bypasses the resumable session state and directly downloads the GGUF file reliably.

### 15.2 ADB and Android SDK
Local builds via `npx expo run:android` require:
- `ANDROID_HOME` pointing to your SDK folder.
- `platform-tools` (containing `adb`) added to your `PATH`.
- A running emulator or connected device in `developer mode`.

---

## 16. Recent Improvements

1. **Model Management UI**: Implemented `app/model-manager.tsx`.
   - Users can now browse, download, and delete local GGUF models.
   - On first-time app launch, users are redirected to this manager if no local model is detected.
2. **Offline Flow**: Integrated `hasDownloadedModel()` into the startup `index.tsx` to ensure the app is "ready for offline" before user interacts.
3. **Database Expansion**: Added a `models` table to manage local LLM files and their storage paths.

---

## 17. Evaluation Summary
Shiksha AI demonstrates a practical offline-first tutoring architecture with multimodal features (text, OCR, vision, math) and native Android integrations (STT + LLM bridge). The project is technically ambitious and functionally broad, with clear real-world educational relevance. The next step to production readiness is stability hardening (type consistency, test coverage, and security controls).
