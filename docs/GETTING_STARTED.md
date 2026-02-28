# Getting Started

## Prerequisites
- Node.js 18+
- npm
- Expo CLI tooling (via `npx expo` from project scripts)
- Ollama installed locally

Optional:
- Android Studio (Android builds)
- Xcode (iOS builds)
- Python (only for optional translation service)

## Setup
```bash
npm install
cd backend && npm install
cd ..
```

Create `.env` in repo root:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

## Run Locally
1. Start Ollama:
```bash
ollama pull qwen2.5:1.5b
ollama serve
```
2. Start backend:
```bash
npm run backend
```
3. Start app:
```bash
npm start
```

## Common Commands
- `npm run android`
- `npm run ios`
- `npm run web`

## Optional Translation Service
```bash
pip install fastapi uvicorn transformers torch sentencepiece
cd backend
python translator_service.py
```
