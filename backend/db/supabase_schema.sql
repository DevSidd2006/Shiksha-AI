-- ==========================================
-- Shiksha AI - Supabase Cloud Schema
-- Purpose: Run this script in your Supabase SQL Editor.
-- This guarantees your cloud DB matches your local SQLite DB.
-- ==========================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  offline_mode SMALLINT DEFAULT 1,
  daily_goal INTEGER DEFAULT 5,
  sound_enabled SMALLINT DEFAULT 1,
  notifications_enabled SMALLINT DEFAULT 1,
  selected_subjects TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Chats Table
CREATE TABLE IF NOT EXISTS public.chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  subject TEXT,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  model_used TEXT,
  tokens INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Progress Table
CREATE TABLE IF NOT EXISTS public.progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  questions_asked INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0.0,
  time_spent INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'medium',
  streak INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, subject)
);

-- 6. Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  target INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Models Table
CREATE TABLE IF NOT EXISTS public.models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  local_path TEXT,
  remote_url TEXT,
  size TEXT,
  status TEXT DEFAULT 'not-downloaded',
  is_default SMALLINT DEFAULT 0,
  type TEXT DEFAULT 'gguf',
  ollama_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) safely
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Create Policies to allow anonymous read/write (since auth is handled locally first for now)
-- WARNING: In a production setting with real users, you should use Supabase Auth and link policies to auth.uid()
CREATE POLICY "Enable all access for anon users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon chats" ON public.chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon progress" ON public.progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon achievements" ON public.achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon models" ON public.models FOR ALL USING (true) WITH CHECK (true);
