# 📚 Siksha AI

**Offline-first AI tutor for Class 9-10 students**

React Native • Expo SDK 54 • Ollama • TypeScript

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/yourusername/siksha-ai.git
cd siksha-ai && npm install

# 2. Pull AI models
ollama pull llama3.2:3b      # Primary tutor
ollama pull qwen3-vl:2b      # Vision model
ollama pull gemma3:1b        # Fallback
ollama serve

# 3. Start backend
cd backend && npm install && npm start  # → localhost:3000

# 4. Run app
cd .. && npm start  # Press 'a' for Android, 'w' for web
```

### Environment
Create `.env` in project root:
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 AI Tutor | Chat with vision-capable AI |
| 📸 Image Analysis | Snap textbook problems for explanations |
| � Text-to-Speech | Hear responses in Hindi, English & more |
| �📝 Notes | Create study notes |
| 🎴 Flashcards | Interactive revision cards |
| ❓ Quizzes | Test your knowledge |
| 📊 Progress | Track learning journey |

---

## Project Structure

```
app/(tabs)/          # Screens: tutor, notes, flashcards, quiz, progress, settings
src/
├── components/      # AuthScreen, ChatBubble, SpotlightTutorial
├── services/        # api, visionService, ocrService, offlineTutor
├── storage/         # Zustand stores (auth, chat, profile, settings)
└── data/            # Class 9 Science content
backend/
├── server.js        # Express API (OCR, tutor proxy, translation)
└── translator_service.py  # NLLB-200 translation (optional)
```

---

## Required Models

| Model | Purpose | Command |
|-------|---------|---------|
| llama3.2:3b | Primary tutor | `ollama pull llama3.2:3b` |
| qwen3-vl:2b | Image analysis | `ollama pull qwen3-vl:2b` |
| gemma3:1b | OCR fallback | `ollama pull gemma3:1b` |

---

## Text-to-Speech (Multilingual)

Built-in speech synthesis for AI responses. **No additional setup required.**

```bash
# Test TTS configuration
node test-tts.js english "Hello, this is a test"
node test-tts.js hindi "नमस्ते, यह एक परीक्षण है"
```

**How to use in app:**
1. Tap speaker icon 🔊 on any tutor response
2. Audio plays in your preferred language
3. Change language in Settings → adjust playback language
4. Rate: 0.9 (slightly slower for clarity)

**Supported Languages:**
- English (en-IN) / US English (en-US)
- Hindi (hi-IN)
- Marathi, Tamil, Telugu, Kannada, Malayalam, Gujarati, Punjabi, Bengali

---

## Multilingual (Optional)

```bash
# Install Python deps
pip install fastapi uvicorn transformers torch sentencepiece

# Start translation service
cd backend && python translator_service.py  # → localhost:3001
```

Supports: English, Hindi, Marathi, Tamil, Telugu, Bengali

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Ollama not connecting | `ollama serve` + check firewall |
| Vision model error | `ollama pull qwen3-vl:2b` |
| OCR not working | Start backend on port 3000 |
| Translation failing | Start `translator_service.py` on 3001 |

---

MIT License
