# Siksha AI - System Architecture (Offline-First v0+)

## 🏗️ High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                     STUDENT'S PHONE                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │      Expo App (React Native) - Works Offline     │ │
│  │                                                     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │ │
│  │  │ Dashboard│  │   Chat   │  │ Settings │       │ │
│  │  │(Local DB)│  │(Offline) │  │          │       │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘       │ │
│  │       │             │             │               │ │
│  │       └─────────────┴─────────────┘               │ │
│  │              ↓                                    │ │
│  │  ┌────────────────────────────────────────────┐ │ │
│  │  │   Offline-First Data Engine               │ │ │
│  │  │  ┌──────────────────────────────────────┐ │ │ │
│  │  │  │  Expo SQLite (Local Database)        │ │ │ │
│  │  │  │  ├─ Chats & Messages                 │ │ │ │
│  │  │  │  ├─ Progress & Analytics             │ │ │ │
│  │  │  │  ├─ Achievements                     │ │ │ │
│  │  │  │  ├─ Sync Queue                       │ │ │ │
│  │  │  │  └─ Cached Responses                 │ │ │ │
│  │  │  └──────────────────────────────────────┘ │ │ │
│  │  │                                            │ │ │
│  │  │  Offline AI: Cached + Ollama (Phase 2)    │ │ │
│  │  │  Voice: expo-speech ✅                     │ │ │
│  │  └────────────────────────────────────────────┘ │ │
│  │              ↕ [Auto-Sync When Online]          │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────┼────────────────────────────────────┘
                     │ (When internet available)
         ┌───────────▼────────────┐
         │  Backend Server        │
         │  (Express + MongoDB)   │
         ├────────────────────────┤
         │ • Sync updates         │
         │ • Ollama API (Phase 2) │
         │ • MongoDB backup       │
         │ • Analytics            │
         └───────────────────────┘
```

## 📱 Frontend Flow (Tutor Screen)

```
User types question
       │
       ▼
┌──────────────┐
│ tutor.tsx    │
└──────┬───────┘
       │ 1. Create user message
       │ 2. Add to UI
       │ 3. Call sendQuestion()
       ▼
┌──────────────┐
│ api.ts       │
└──────┬───────┘
       │ POST /tutor
       │ { question: "..." }
       ▼
┌──────────────┐
│ Backend      │ ──────► OpenAI API
│ server.js    │ ◄────── AI Response
└──────┬───────┘
       │ { answer: "...", timestamp: "..." }
       ▼
┌──────────────┐
│ tutor.tsx    │
└──────┬───────┘
       │ 1. Create AI message
       │ 2. Add to UI
       │ 3. Save to storage
       ▼
┌──────────────┐
│ chatStore.ts │
└──────┬───────┘
       │ Store in AsyncStorage
       ▼
     Done!
```

## 💾 Data Storage Flow

```
┌─────────────────────────────────────┐
│      AsyncStorage (Phone)           │
│                                     │
│  Key: @siksha_current_chat          │
│  Value: {                           │
│    id: "1703345678901",             │
│    messages: [                      │
│      { id, text, isUser, timestamp },│
│      { id, text, isUser, timestamp },│
│      ...                            │
│    ],                               │
│    timestamp: "2025-12-23..."       │
│  }                                  │
│                                     │
│  Key: @siksha_chat_history          │
│  Value: [                           │
│    { id, messages[], timestamp },   │
│    { id, messages[], timestamp },   │
│    ... (up to 50 chats)             │
│  ]                                  │
└─────────────────────────────────────┘
```

## 🔄 Component Relationships

```
App Root
  │
  └─ Stack Navigator (_layout.tsx)
      │
      ├─ Index Screen (redirects to tutor)
      │
      └─ Tabs Navigator ((tabs)/_layout.tsx)
          │
          ├─ Tutor Tab (tutor.tsx)
          │   │
          │   ├─ Uses: ChatBubble component
          │   ├─ Calls: api.sendQuestion()
          │   └─ Saves: chatStore.saveChat()
          │
          ├─ History Tab (history.tsx)
          │   │
          │   └─ Reads: chatStore.getAllChats()
          │
          └─ Settings Tab (settings.tsx)
              │
              └─ Calls: chatStore.deleteAllChats()
```

## 🔌 Backend API Endpoints

```
┌──────────────────────────────────────────────┐
│  Backend Server (Express on Port 3000)      │
├──────────────────────────────────────────────┤
│                                              │
│  GET /                                       │
│  └─► Health check, returns status           │
│      Response: { status: "ok", ... }        │
│                                              │
│  POST /tutor                                 │
│  ├─► Input: { question: string }            │
│  ├─► Process:                               │
│  │   1. Validate request                    │
│  │   2. Call OpenAI API                     │
│  │   3. Format response                     │
│  └─► Output: { answer: string,              │
│               timestamp: string }            │
│                                              │
└──────────────────────────────────────────────┘
```

## 🔐 Security Model

```
Frontend (Untrusted)
    │
    │ Only sends questions
    │ Never sees API key
    ▼
Backend (Trusted)
    │
    │ Stores OpenAI key in .env
    │ Validates all requests
    │ Rate limiting (future)
    ▼
OpenAI API
    │
    │ Authenticated with key
    │ Returns AI responses
    ▼
Backend
    │
    │ Sanitizes response
    ▼
Frontend
    │
    │ Displays to user
    ▼
User sees answer
```

## 📦 Dependencies Tree

```
Frontend Dependencies
├── expo (~50.0.0) - Core framework
├── expo-router (~3.4.0) - Navigation
├── react (18.2.0) - UI library
├── react-native (0.73.0) - Native bridge
├── @react-native-async-storage/async-storage (1.21.0) - Storage
├── @react-native-picker/picker (2.6.1) - Picker component
├── react-native-safe-area-context (4.8.2) - Safe areas
├── react-native-screens (~3.29.0) - Native screens
├── expo-constants (~15.4.0) - App constants
├── expo-linking (~6.2.0) - Deep linking
└── expo-status-bar (~1.11.0) - Status bar

Backend Dependencies
├── express (^4.18.2) - Web framework
├── cors (^2.8.5) - CORS middleware
├── dotenv (^16.3.1) - Environment variables
└── openai (^4.20.0) - OpenAI SDK
```

## 🎯 Request/Response Examples

### 1. Tutor Question Flow

**Request (Frontend → Backend):**
```json
POST http://localhost:3000/tutor
Content-Type: application/json

{
  "question": "What is photosynthesis?"
}
```

**Internal (Backend → OpenAI):**
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful and patient AI tutor..."
    },
    {
      "role": "user",
      "content": "What is photosynthesis?"
    }
  ],
  "max_tokens": 500,
  "temperature": 0.7
}
```

**Response (Backend → Frontend):**
```json
{
  "answer": "Photosynthesis is the process by which plants...",
  "timestamp": "2025-12-23T10:30:00.000Z"
}
```

### 2. Storage Operations

**Save Chat:**
```typescript
// Input
messages = [
  { id: "1", text: "What is 2+2?", isUser: true, timestamp: Date },
  { id: "2", text: "2+2 equals 4", isUser: false, timestamp: Date }
]

// Stored as
{
  "@siksha_current_chat": {
    id: "1703345678901",
    messages: [...],
    timestamp: "2025-12-23T10:30:00.000Z"
  }
}
```

## 🚦 State Management

```
┌──────────────────────────────────────┐
│        Component State               │
│  (React useState/useEffect)          │
│                                      │
│  Tutor Screen:                       │
│  ├─ messages[]                       │
│  ├─ inputText                        │
│  └─ isLoading                        │
│                                      │
│  History Screen:                     │
│  └─ chats[]                          │
│                                      │
│  Settings Screen:                    │
│  ├─ language                         │
│  └─ offlineMode                      │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│      Persistent State                │
│      (AsyncStorage)                  │
│                                      │
│  ├─ Current chat session             │
│  └─ Chat history (up to 50)          │
└──────────────────────────────────────┘
```

## 🧩 File Imports Map

```
tutor.tsx
├── imports ChatBubble from '@/components/ChatBubble'
├── imports sendQuestion from '@/services/api'
└── imports saveChat, getCurrentChat from '@/storage/chatStore'

history.tsx
└── imports getAllChats, deleteAllChats from '@/storage/chatStore'

settings.tsx
└── imports deleteAllChats from '@/storage/chatStore'

api.ts
└── uses fetch() (built-in)

chatStore.ts
└── imports AsyncStorage from '@react-native-async-storage/async-storage'
```

## 🔧 Configuration Files Purpose

```
app.json ───────────► Expo configuration
tsconfig.json ──────► TypeScript settings
babel.config.js ────► Babel transpilation
package.json ───────► Dependencies & scripts
.gitignore ─────────► Git exclusions
backend/.env ───────► API keys (SECRET!)
```

---

This architecture is intentionally **simple** for v0. As you add features, you can:
- Add state management (Redux, Zustand)
- Switch to SQLite for complex queries
- Add authentication layer
- Implement caching strategies
- Add error boundaries
- Implement retry logic

graph TD
    subgraph "📱 Mobile Client (React Native + Expo)"
        UI[User Interface - Tabs/Screens]
        Store[Zustand & AsyncStorage - UI State]
        DB[(Local SQLite - Offline Data)]
        Math[MathSolver - mathjs + KaTeX]
        TTS[Multilingual TTS - expo-speech]
        Camera[Camera & ImagePicker]
    end

    subgraph "⚙️ Backend Services (Node.js/Express)"
        Proxy[Proxy API Server - Port 3000]
        OCR[Tesseract.js Engine]
        DocProc[Document Processor]
    end

    subgraph "🤖 AI Layer (Local Intelligence)"
        Ollama[Ollama Engine - Port 11434]
        Gemma[(Gemma3:latest - Unified Text/Vision)]
    end

    subgraph "🌍 Multilingual Microservice (Python)"
        NLLB[NLLB-200 Translator - Port 3001]
    end

    %% Connections
    UI --> Math
    UI --> Store
    Store --> DB
    UI --> TTS
    
    Camera --> UI
    UI -- "images + questions" --> Proxy
    
    Proxy --> OCR
    Proxy -- "proxy request" --> Ollama
    Ollama --> Gemma
    
    Proxy -- "translate" --> NLLB
    
    Ollama -- "response" --> Proxy
    Proxy -- "structured JSON" --> UI
