# Project Structure

## Top-Level Folders
- `app/`: route-first screens and layouts (Expo Router)
- `src/`: application modules that are reused across screens
- `backend/`: Express backend for tutor/OCR/vision routes
- `android/`, `ios/`: native mobile projects
- `assets/`: static app assets
- `docs/assets/screenshots/`: documentation and demo screenshots

## Frontend Breakdown
- `app/(tabs)/`: primary feature screens (`tutor`, `notes`, `flashcards`, `quiz`, `progress`, `settings`, `profile`, `dashboard`)
- `src/features/`: feature-oriented app modules
- `src/features/ai/`: tutor, OCR, speech, model services
- `src/features/chat/`: chat UI components and chat storage
- `src/features/content/`: curriculum, notes, quiz content
- `src/features/progress/`: dashboard and achievement services
- `src/features/user/`: auth/profile/settings persistence
- `src/features/auth/`: authentication UI components
- `src/features/onboarding/`: onboarding/tutorial components and illustrations
- `src/core/database/`: SQLite init and sync infrastructure
- `src/core/services/`: shared core integrations (e.g., Supabase client)
- `src/shared/styles/`: design system primitives

## Backend Breakdown
- `backend/server.js`: main Express server
- `backend/translator_service.py`: optional translation service
- `backend/*.traineddata`: OCR language data files
- `backend/db/supabase_schema.sql`: schema reference for Supabase setup

## Documentation Files
- `README.md`: primary onboarding entry
- `docs/*`: curated developer docs
- `docs/legacy/*`: legacy docs kept for historical reference
