# Shiksha AI

Offline-first AI tutor app for Class 9 students, built with Expo React Native + a local-first AI/backend pipeline.

## Repository Overview
- `app/`: Expo Router screens and navigation (`index`, `setup-choice`, `model-manager`, and tab routes)
- `src/features/`: feature modules (`ai`, `chat`, `content`, `progress`, `user`, `auth`, `onboarding`)
- `src/core/`: core services including sync and database initialization
- `src/shared/`: shared theme/design utilities
- `backend/`: Express API for tutor, OCR, translation, and dashboard stats
- `android/`, `ios/`: native mobile projects
- `docs/`: current developer documentation

## Current Capabilities
- AI Tutor chat with Ollama-powered responses
- OCR pipeline for image-to-text extraction (English + Hindi trained data)
- Document post-processing (`correct`, `summarize`, `qa`, `extract` tasks)
- Translation support with NLLB microservice + cloud fallback
- Notes, flashcards, quiz, progress, profile/account screens
- Local-first persistence and sync hooks

## Tech Stack
- Frontend: React Native 0.81 + Expo SDK 54 + Expo Router + TypeScript
- Storage: Expo SQLite + AsyncStorage
- Backend: Node.js + Express + Axios + Tesseract.js
- AI runtime: Ollama (default model: `hf.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M`)

## Quick Start
### 1. Install dependencies
```bash
npm install
cd backend && npm install
cd ..
```

### 2. Configure environment
Create `.env` in the project root:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

Recommended backend `.env` (inside `backend/`):
```env
PORT=3000
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=hf.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M
TRANSLATOR_SERVICE_URL=http://localhost:3001
```

For physical devices, replace `10.0.2.2` with your machine LAN IP (example: `http://192.168.1.25:3000`).

### 3. Start Ollama
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

Expo shortcuts in terminal: `a` (Android), `i` (iOS), `w` (web).

## Scripts
Root:
- `npm start`: start Expo dev server
- `npm run android`: run Android build
- `npm run ios`: run iOS build
- `npm run web`: run web build
- `npm run export-web`: export web artifacts
- `npm run backend`: start backend (`backend/server.js`)

Backend (`backend/package.json`):
- `npm start`: start Express server
- `npm run dev`: start with nodemon

## Backend API (Current)
- `GET /`: health check
- `GET /dashboard/:userId`: dashboard/progress stats
- `POST /tutor`: tutor responses from Ollama
- `POST /process-document`: OCR/document enhancement tasks
- `POST /translate`: translation endpoint
- `POST /ocr`: OCR extraction from base64 image

## Project Structure
```text
Shiksha-AI/
├── app/                  # Route screens (tabs + setup/model management)
├── src/
│   ├── features/         # Feature modules and domain logic
│   ├── core/             # Core infrastructure (db/sync)
│   └── shared/           # Theme + shared styles/utils
├── backend/              # Express backend + OCR/translation services
│   ├── db/               # Database services and stats
│   └── *.traineddata     # OCR language files
├── android/              # Android native project
├── ios/                  # iOS native project
├── assets/               # Static assets
├── scripts/              # Build/runtime helper scripts
└── docs/                 # Current + legacy docs
```

## Documentation Map
Current docs:
- `docs/GETTING_STARTED.md`
- `docs/PROJECT_STRUCTURE.md`
- `docs/ARCHITECTURE_STATUS.md`
- `docs/FEATURES.md`

Legacy reference docs:
- `docs/legacy/README.md`
- `docs/legacy/ARCHITECTURE.md`
- `docs/legacy/project_doc.md`
- `docs/legacy/TTS_IMPLEMENTATION.md`

Security notes:
- `SECURITY.md`

## Optional Translation Microservice
If you want to run the Python translator service locally:
```bash
pip install fastapi uvicorn transformers torch sentencepiece
cd backend
python translator_service.py
```

## Troubleshooting
- Ollama unavailable: run `ollama serve`
- Missing model: run `ollama pull hf.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M`
- Backend unreachable: ensure `npm run backend` is running on port `3000`
- Android emulator networking: use `http://10.0.2.2:3000`
- Device networking: use LAN IP for `EXPO_PUBLIC_API_URL` (not `localhost`)

## License
MIT
