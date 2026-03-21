# Shiksha AI

Offline-first AI tutor app for Class 9-10 students.

## What This Repo Contains
- `app/`: Expo Router screens and navigation.
- `src/features/`: feature-oriented modules (AI, chat, content, progress, user, auth, onboarding).
- `src/core/`: shared core infrastructure (database and local sync abstraction).
- `src/shared/`: cross-feature shared utilities/styles.
- `backend/`: Express API for tutor, OCR, and vision endpoints.
- `android/`, `ios/`: native projects.
- `docs/`: documentation entry points for developers.

## Core Capabilities
- AI tutor chat (local/online flow)
- OCR from textbook images
- Vision question answering
- Math expression parsing and solving support
- Notes, flashcards, quiz, progress tracking
- Multilingual text-to-speech

## Tech Stack
- Mobile: React Native + Expo (SDK 54), Expo Router, TypeScript
- Local storage: Expo SQLite + AsyncStorage
- Backend: Node.js + Express + Axios + Tesseract.js
- AI runtime: Ollama (`hf.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M` default)

## Quick Start
### 1. Install dependencies
```bash
npm install
cd backend && npm install
cd ..
```

### 2. Configure environment
Create `.env` in project root:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```
Use your machine's LAN URL instead of `10.0.2.2` when testing on a physical device, for example `http://192.168.1.25:3000`.

### 3. Start local model runtime
```bash
ollama pull hf.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M
ollama serve
```

### 4. Start backend
```bash
npm run backend
```

### 5. Start app
```bash
npm start
```
Use Expo options (`a` for Android, `i` for iOS, `w` for web).

## Scripts
- `npm start`: Start Expo dev server
- `npm run android`: Build/run Android app
- `npm run ios`: Build/run iOS app
- `npm run web`: Start web build
- `npm run backend`: Start backend server

## Project Structure
```text
Shiksha-AI/
├── app/                  # Route screens (tabs + entry screens)
├── src/
│   ├── features/         # Feature-first modules and domain code
│   ├── core/             # Core infrastructure and integrations
│   └── shared/           # Shared styles/utilities across features
├── backend/              # Express backend + OCR/translation helpers
├── android/              # Android native project
├── ios/                  # iOS native project
├── assets/               # App assets/icons/svgs
├── scripts/              # Build/runtime helper scripts
├── backend/db/           # Database and SQL artifacts
└── docs/                 # Team-facing documentation
```

## Documentation Map
Start here for deeper technical context:
- `docs/GETTING_STARTED.md`
- `docs/PROJECT_STRUCTURE.md`
- `docs/ARCHITECTURE_STATUS.md`
- `docs/FEATURES.md`

Legacy detailed docs kept for reference:
- `docs/legacy/ARCHITECTURE.md`
- `docs/legacy/project_doc.md`
- `docs/legacy/TTS_IMPLEMENTATION.md`
- `SECURITY.md`

## Troubleshooting
- Ollama not reachable: run `ollama serve`
- Model missing: run `ollama pull hf.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M`
- Backend errors: confirm `npm run backend` is running on port `3000`
- Android emulator networking: use `10.0.2.2` instead of `localhost`
- Physical-device OCR/vision requests: set `EXPO_PUBLIC_API_URL` to your computer's LAN address, not `localhost`

## License
MIT
