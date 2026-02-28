# Architecture Status

This file explains which architecture notes are current vs historical.

## Current Implementation (Repository State)
- Expo React Native app (`app/`, `src/`)
- Express backend (`backend/server.js`)
- Ollama local model runtime (default `qwen2.5:1.5b`)
- OCR route using Tesseract.js in backend
- Local persistence using SQLite and AsyncStorage

## Historical/Legacy Notes
Some sections in `docs/legacy/ARCHITECTURE.md` and `docs/legacy/project_doc.md` describe earlier designs and should be treated as reference material, not strict source of truth.

## Source of Truth Priority
1. Code in `app/`, `src/`, and `backend/`
2. `README.md` and files in `docs/`
3. Legacy docs (`docs/legacy/ARCHITECTURE.md`, `docs/legacy/project_doc.md`)
