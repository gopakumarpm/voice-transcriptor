# Voice Transcriptor — Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Live URLs & Accounts](#live-urls--accounts)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Architecture](#architecture)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Features](#features)
9. [Pages & Routes](#pages--routes)
10. [State Management (Stores)](#state-management-stores)
11. [Services](#services)
12. [Database Schema](#database-schema)
13. [Supabase Cloud Schema](#supabase-cloud-schema)
14. [Type System](#type-system)
15. [AI Integration](#ai-integration)
16. [Audio Processing Pipeline](#audio-processing-pipeline)
17. [Sync Architecture](#sync-architecture)
18. [Authentication Flow](#authentication-flow)
19. [Export Formats](#export-formats)
20. [Collaboration System](#collaboration-system)
21. [PWA Configuration](#pwa-configuration)
22. [Deployment](#deployment)
23. [Configuration Files](#configuration-files)

---

## Overview

Voice Transcriptor is an AI-powered Progressive Web App (PWA) for voice transcription and analysis. It records audio or accepts file uploads, transcribes using OpenAI Whisper, and generates intelligent analysis using Claude (Anthropic). The app follows an **offline-first** architecture — all data is stored locally in IndexedDB via Dexie, with optional cloud sync to Supabase for multi-device access.

**Key Capabilities:**
- Record audio directly in-browser or upload audio files
- Transcribe with OpenAI Whisper (whisper-1 or gpt-4o-transcribe models)
- AI-powered analysis: summaries, key topics, sentiment, action items, decisions, meeting minutes
- Auto-detect transcription mode (meeting, interview, lecture, etc.)
- Smart auto-naming of recordings based on transcript content
- Audio enhancement (noise gate, high-pass filter, compression)
- Export to TXT, PDF, DOCX, SRT, VTT, JSON
- Task board with Kanban workflow
- Analytics dashboard with charts
- Real-time collaboration via comments (Supabase Realtime)
- Sharing transcriptions with other users
- Installable PWA with offline support

---

## Live URLs & Accounts

| Service | URL / Identifier |
|---------|-----------------|
| **Live App** | https://voice-transcriptor-ai.netlify.app |
| **GitHub Repo** | https://github.com/gopakumarpm/voice-transcriptor |
| **Supabase Project** | Project ID: `gozwwgrptkijpicxuafe` |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/gozwwgrptkijpicxuafe |
| **Netlify Site** | Site ID: `67040d15-1ddd-454c-b30d-2ab08a7cb901` |

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | React | 19.2 |
| **Language** | TypeScript | 5.9 |
| **Build Tool** | Vite | 7.3 |
| **Styling** | Tailwind CSS | 4.2 |
| **State Management** | Zustand | 5.0 |
| **Local Database** | Dexie (IndexedDB) | 4.3 |
| **Cloud Backend** | Supabase | 2.97 |
| **Routing** | React Router DOM | 7.13 |
| **Charts** | Recharts | 3.7 |
| **Audio Waveform** | wavesurfer.js | 7.12 |
| **Animations** | Framer Motion | 12.34 |
| **Icons** | Lucide React | 0.575 |
| **PDF Export** | jsPDF | 4.2 |
| **DOCX Export** | docx | 9.5 |
| **Date Utils** | date-fns | 4.1 |
| **ID Generation** | nanoid | 5.1 |
| **PWA Plugin** | vite-plugin-pwa | 1.2 |

---

## Project Structure

```
Voice Transcriptor/
├── public/
│   ├── favicon.svg          # App favicon (SVG with filters)
│   ├── logo.svg             # In-app logo (clean, no filters)
│   ├── logo-192.png         # PWA icon 192x192
│   ├── logo-512.png         # PWA icon 512x512
│   └── vite.svg             # Default Vite icon
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthGuard.tsx       # Route protection (redirects to /auth if not logged in)
│   │   │   └── UserMenu.tsx        # Header avatar + sign-out dropdown
│   │   ├── collaboration/
│   │   │   ├── CommentInput.tsx     # Comment text input form
│   │   │   └── CommentThread.tsx    # Real-time comment list
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Main layout shell (sidebar + header + outlet)
│   │   │   ├── Header.tsx           # Top bar with search, user menu
│   │   │   └── Sidebar.tsx          # Navigation sidebar
│   │   ├── sharing/
│   │   │   └── ShareDialog.tsx      # Modal to share transcription by email
│   │   └── ui/
│   │       └── index.tsx            # Reusable UI primitives (Toggle, etc.)
│   ├── config/
│   │   ├── constants.ts            # App constants (file sizes, speaker colors, speeds)
│   │   ├── languages.ts            # 50+ supported languages grouped by region
│   │   └── transcriptionModes.ts   # 11 transcription modes with AI prompts
│   ├── db/
│   │   └── index.ts                # Dexie database schema (7 tables)
│   ├── lib/
│   │   └── supabase.ts             # Supabase client initialization
│   ├── pages/
│   │   ├── AnalyticsPage.tsx        # Charts and usage statistics
│   │   ├── AuthPage.tsx             # Login / sign up / guest mode
│   │   ├── DashboardPage.tsx        # Transcription list, starred, recent
│   │   ├── NewTranscriptionPage.tsx # Record or upload + start transcription
│   │   ├── ProjectsPage.tsx         # Projects and folders management
│   │   ├── SearchPage.tsx           # Full-text search across transcriptions
│   │   ├── SettingsPage.tsx         # API keys, preferences, toggles
│   │   ├── TaskBoardPage.tsx        # Kanban board (Todo/In Progress/Done)
│   │   └── TranscriptionDetailPage.tsx # Full view with player, transcript, analysis
│   ├── services/
│   │   ├── analyticsService.ts      # Compute analytics from local DB
│   │   ├── audioEnhancer.ts         # Web Audio API pre-processing
│   │   ├── claude.ts                # Claude API (analyze, detect mode, generate title)
│   │   ├── exportService.ts         # Export to TXT/PDF/DOCX/SRT/VTT/JSON
│   │   ├── sharingService.ts        # Share/unshare via Supabase
│   │   ├── syncService.ts           # Local ↔ Cloud bidirectional sync
│   │   └── whisper.ts               # OpenAI Whisper transcription
│   ├── stores/
│   │   ├── useAuthStore.ts          # Auth state (user, session, profile)
│   │   ├── useCollaborationStore.ts # Real-time comments via Supabase Realtime
│   │   ├── usePlayerStore.ts        # Audio playback state
│   │   ├── useRecordingStore.ts     # MediaRecorder state and controls
│   │   ├── useSettingsStore.ts      # App settings (persisted to localStorage)
│   │   ├── useTaskStore.ts          # Task CRUD with Dexie
│   │   ├── useTranscriptionStore.ts # Transcription pipeline orchestration
│   │   └── useUIStore.ts            # Theme, sidebar, toasts, modals
│   ├── types/
│   │   ├── analysis.ts              # Analysis types (sentiment, action items, etc.)
│   │   ├── audio.ts                 # AudioFile, PlaybackSpeed
│   │   ├── comment.ts               # Comment type
│   │   ├── index.ts                 # Re-exports all types
│   │   ├── project.ts               # Project, Folder, Tag
│   │   ├── settings.ts              # AppSettings, Theme, WhisperModel
│   │   ├── task.ts                  # Task, TaskStatus, TaskPriority
│   │   └── transcription.ts         # Transcription, Segment, Word, Bookmark
│   ├── utils/
│   │   ├── cn.ts                    # clsx + tailwind-merge utility
│   │   ├── formatters.ts            # Duration, timestamp, date, file size formatters
│   │   └── idGenerator.ts           # nanoid wrapper
│   ├── App.tsx                      # Root component with routing
│   ├── index.css                    # Global CSS + Tailwind
│   └── main.tsx                     # React DOM entry point
├── .env                             # Supabase credentials (gitignored)
├── .env.example                     # Template for environment variables
├── .gitignore
├── eslint.config.js
├── index.html
├── netlify.toml                     # Netlify build + SPA redirect config
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts                   # Vite + React + Tailwind + PWA config
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser (PWA)                  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  React   │  │ Zustand  │  │   Dexie       │  │
│  │  Pages   │←→│  Stores  │←→│  (IndexedDB)  │  │
│  └──────────┘  └────┬─────┘  └───────┬───────┘  │
│                     │                │           │
│  ┌──────────────────┴────────────────┘           │
│  │           Services Layer                      │
│  │                                               │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────────┐   │
│  │  │ Whisper │ │ Claude  │ │  Sync        │   │
│  │  │ Service │ │ Service │ │  Service     │   │
│  │  └────┬────┘ └────┬────┘ └──────┬───────┘   │
│  └───────┼──────────┼─────────────┼─────────────│
│          │          │             │              │
└──────────┼──────────┼─────────────┼──────────────┘
           │          │             │
    ┌──────▼──┐ ┌─────▼────┐ ┌─────▼─────┐
    │ OpenAI  │ │Anthropic │ │ Supabase  │
    │   API   │ │   API    │ │  (Cloud)  │
    └─────────┘ └──────────┘ └───────────┘
```

**Data Flow:**
1. User records audio → `useRecordingStore` manages MediaRecorder
2. Audio blob saved to Dexie (`audioFiles` table) → stays local-only
3. Whisper API transcribes → segments/words saved to Dexie (`transcriptions`)
4. Claude API analyzes → analysis saved to Dexie (`analyses`)
5. Claude generates smart title → updates transcription title
6. Sync service pushes text data to Supabase (non-blocking)

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key (for transcription)
- Anthropic API key (for AI analysis)
- Supabase project (optional, for cloud sync)

### Installation

```bash
git clone https://github.com/gopakumarpm/voice-transcriptor.git
cd voice-transcriptor
npm install
```

### Configuration

Copy the environment template and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

API keys (OpenAI + Anthropic) can also be set in the app's Settings page at runtime — they are stored in localStorage, never sent to any server except their respective APIs.

### Development

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # TypeScript check + production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | No* | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No* | Supabase anonymous key |

*Without Supabase, the app runs in local-only/guest mode. All features work except cloud sync, auth, sharing, and collaboration.

**Runtime API keys (stored in localStorage via Settings page):**
| Key | Required For |
|-----|-------------|
| OpenAI API Key | Transcription (Whisper API) |
| Anthropic API Key | AI analysis, mode detection, smart titles |

---

## Features

### Core Features
- **Audio Recording**: In-browser recording via MediaRecorder API with pause/resume, audio level visualization
- **File Upload**: Support for MP3, WAV, M4A, OGG, FLAC, WebM, AAC (up to 500MB, Whisper limit 25MB)
- **Transcription**: OpenAI Whisper with word-level timestamps, segment grouping
- **Model Selection**: Choose between `whisper-1` (faster) and `gpt-4o-transcribe` (more accurate)
- **AI Analysis**: Summary, key topics, sentiment analysis, action items, decisions, follow-ups
- **Mode-Aware Analysis**: 11 specialized modes with tailored AI prompts
- **Auto-Detect Mode**: AI classifies the transcript type automatically
- **Smart Auto-Naming**: Claude generates descriptive 3-7 word titles from content
- **Audio Enhancement**: Web Audio API noise gate, 80Hz high-pass filter, dynamic compression

### Transcription Modes (11)
| Mode | Icon | Use Case |
|------|------|----------|
| Meeting | Users | Minutes, action items, decisions |
| Interview | UserCheck | Q&A extraction, candidate evaluation |
| Lecture | GraduationCap | Study notes, concepts, outlines |
| Phone Call | Phone | Call summary, commitments |
| Podcast | Headphones | Chapters, key quotes, highlights |
| Brainstorm | Lightbulb | Ideas grouped by theme |
| Voice Note | Mic | Quick notes, to-dos, reminders |
| Legal | Scale | Verbatim with legal annotations |
| Medical | Stethoscope | Patient notes, diagnosis, prescriptions |
| General | FileText | Basic summary and key topics |
| Auto-Detect | Sparkles | AI classifies the type |

### Organization
- **Projects**: Group transcriptions with color-coded projects
- **Folders**: Nested folder structure within projects
- **Tags**: Tag transcriptions for cross-project categorization
- **Star/Favorite**: Quick access to important transcriptions
- **Search**: Full-text search across all transcriptions

### Task Management
- **Kanban Board**: Todo → In Progress → Done workflow
- **Auto-Create Tasks**: Convert AI-extracted action items to tasks
- **Task Properties**: Title, description, priority (high/medium/low), owner, due date
- **Linked Tasks**: Tasks linked back to source transcription timestamp

### Export
- **TXT**: Plain text with timestamps, speakers, analysis
- **PDF**: Formatted PDF with headers, sections, pagination
- **DOCX**: Microsoft Word with proper headings, styling
- **SRT**: SubRip subtitle format
- **VTT**: WebVTT subtitle format
- **JSON**: Full structured data export

### Collaboration (requires Supabase)
- **Share Transcriptions**: Invite users by email with viewer/editor access
- **Real-time Comments**: Comments anchored to audio timestamps, live updates via Supabase Realtime
- **Presence**: See who's currently viewing a transcription

### Analytics Dashboard
- Transcriptions over time (line chart)
- Duration by week (bar chart)
- Mode distribution (pie chart)
- Sentiment distribution
- Top topics across all transcriptions
- Task completion stats
- Word frequency analysis

---

## Pages & Routes

| Route | Page Component | Auth Required | Description |
|-------|---------------|---------------|-------------|
| `/auth` | `AuthPage` | No | Login, sign up, Google OAuth, guest mode |
| `/` | `DashboardPage` | Yes* | Transcription list, starred, filters |
| `/new` | `NewTranscriptionPage` | Yes* | Record or upload, configure, start |
| `/transcription/:id` | `TranscriptionDetailPage` | Yes* | Player, transcript, analysis, export |
| `/tasks` | `TaskBoardPage` | Yes* | Kanban board |
| `/projects` | `ProjectsPage` | Yes* | Projects and folders |
| `/search` | `SearchPage` | Yes* | Full-text search |
| `/analytics` | `AnalyticsPage` | Yes* | Charts and statistics |
| `/settings` | `SettingsPage` | Yes* | API keys, preferences |

*Guest mode (no account) also grants access to all protected routes.

---

## State Management (Stores)

All stores use **Zustand** for lightweight, hook-based state management.

### `useAuthStore`
Manages authentication state with Supabase Auth.

| State | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | Supabase auth user |
| `session` | `Session \| null` | Current session |
| `profile` | `UserProfile \| null` | Profile from `profiles` table |
| `loading` | `boolean` | Auth initialization in progress |
| `isGuest` | `boolean` | Running without account |

| Action | Description |
|--------|-------------|
| `initialize()` | Check session, listen for auth changes |
| `signIn(email, password)` | Email/password login |
| `signUp(email, password, name)` | Registration |
| `signInWithGoogle()` | Google OAuth |
| `signOut()` | Logout, clear state |
| `continueAsGuest()` | Skip auth, run local-only |

### `useTranscriptionStore`
Orchestrates the transcription pipeline.

| State | Type | Description |
|-------|------|-------------|
| `currentId` | `string \| null` | Active transcription ID |
| `status` | `TranscriptionStatus` | Pipeline stage |
| `progress` | `number` | 0–100 progress |
| `progressMessage` | `string` | User-facing status text |
| `selectedMode` | `TranscriptionMode` | Chosen mode |
| `selectedLanguage` | `string` | Language code |
| `error` | `string \| null` | Error message |

| Action | Description |
|--------|-------------|
| `startTranscription(blob, name, openaiKey, anthropicKey)` | Full pipeline: save audio → enhance → transcribe → analyze → title |
| `runAnalysis(id, anthropicKey)` | Re-run analysis on existing transcription |

### `useRecordingStore`
Controls the MediaRecorder for in-browser audio recording.

| State | Type | Description |
|-------|------|-------------|
| `status` | `idle \| recording \| paused \| processing` | Recording state |
| `duration` | `number` | Seconds recorded |
| `audioLevel` | `number` | 0–1 current volume level |

| Action | Description |
|--------|-------------|
| `startRecording()` | Request microphone, start MediaRecorder |
| `pauseRecording()` | Pause recording |
| `resumeRecording()` | Resume from pause |
| `stopRecording()` | Stop and return audio Blob |
| `cancelRecording()` | Discard recording |

### `useTaskStore`
CRUD operations for the task board.

| Action | Description |
|--------|-------------|
| `loadTasks()` | Load all tasks from Dexie |
| `addTask(data)` | Create new task |
| `updateTask(id, updates)` | Partial update |
| `deleteTask(id)` | Delete task |
| `moveTask(id, status)` | Move between columns |
| `createFromActionItems(items, transcriptionId)` | Batch create from AI analysis |

### `usePlayerStore`
Audio playback state for wavesurfer.js integration.

| State | Description |
|-------|-------------|
| `isPlaying` | Playback active |
| `currentTime` | Current position (seconds) |
| `duration` | Total duration |
| `speed` | Playback speed (0.5x–3x) |
| `volume` | 0–1 volume |
| `isMuted` | Mute toggle |

### `useSettingsStore`
Persisted to `localStorage` under key `vt-settings`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `openaiApiKey` | string | `''` | OpenAI API key |
| `anthropicApiKey` | string | `''` | Anthropic API key |
| `defaultLanguage` | string | `'en'` | Default transcription language |
| `defaultMode` | TranscriptionMode | `'auto-detect'` | Default mode |
| `enableAutoDetect` | boolean | `true` | Auto-detect mode |
| `autoDetectDuration` | number | `90` | Seconds for detection |
| `defaultPlaybackSpeed` | PlaybackSpeed | `1` | Default playback speed |
| `skipSilence` | boolean | `false` | Skip silent sections |
| `theme` | Theme | `'dark'` | UI theme |
| `fontSize` | string | `'medium'` | Transcript font size |
| `showConfidence` | boolean | `true` | Show word confidence |
| `showTimestamps` | boolean | `true` | Show timestamps |
| `showSpeakerLabels` | boolean | `true` | Show speaker names |
| `enableNotifications` | boolean | `true` | Browser notifications |
| `enableAudioEnhancement` | boolean | `false` | Pre-process audio |
| `whisperModel` | WhisperModel | `'whisper-1'` | Whisper model choice |
| `enableCloudSync` | boolean | `true` | Sync to Supabase |

### `useUIStore`
UI state: theme, sidebar, toasts, modals.

### `useCollaborationStore`
Real-time comments via Supabase Realtime `postgres_changes` subscriptions.

---

## Services

### `whisper.ts` — Transcription Service
- **API**: `POST https://api.openai.com/v1/audio/transcriptions`
- **Models**: `whisper-1` (default) or `gpt-4o-transcribe`
- **Output**: Verbose JSON with word-level timestamps and segments
- **Validation**: API key format check (`sk-` prefix), auth pre-check via `/v1/models`
- **File handling**: Converts Blob to File with correct extension for Whisper
- **Supported formats**: WebM, MP3, WAV, M4A, OGG, FLAC, AAC

### `claude.ts` — AI Analysis Service
- **API**: `POST https://api.anthropic.com/v1/messages`
- **Model**: `claude-sonnet-4-20250514`
- **Functions**:
  - `analyzeTranscript()` — Full structured analysis with mode-specific prompts (max 100K chars)
  - `detectMode()` — Classify transcript into one of 11 modes with confidence score
  - `generateTitle()` — Generate 3-7 word descriptive title from first 2000 chars
  - `customQuery()` — Ad-hoc questions about the transcript (up to 80K chars)

### `syncService.ts` — Cloud Sync
- **Strategy**: Local-first, cloud sync after writes
- **Queue**: Operations queued when offline, processed on `window.online` event
- **Functions**:
  - `syncTranscription()` / `syncAnalysis()` / `syncTask()` — Upsert to Supabase
  - `pullTranscriptions()` — Pull from cloud, merge with last-write-wins
  - `syncAll()` — Full sync (drain queue + pull)
  - `uploadAudio()` / `getAudioUrl()` — Storage bucket operations (currently disabled to save space)
- **Audio**: Stays local-only in IndexedDB, not uploaded to Supabase Storage

### `audioEnhancer.ts` — Audio Pre-processing
Uses Web Audio API's `OfflineAudioContext` for non-real-time processing:
- **High-pass filter**: BiquadFilter at 80Hz (Q=0.7) removes rumble/hum
- **Dynamic compression**: threshold -24dB, ratio 4:1, 3ms attack, 250ms release
- **Noise gate**: Post-processing at -40dB threshold with 1ms attack, 50ms release
- **Output**: Converts to WAV format for optimal Whisper compatibility

### `exportService.ts` — Multi-format Export
- **TXT**: Plain text with optional timestamps, speakers, analysis sections
- **PDF**: jsPDF with title, metadata, transcript, analysis sections, auto-pagination
- **DOCX**: docx library with Word headings, styled text runs, proper spacing
- **SRT**: Standard SubRip subtitle format
- **VTT**: WebVTT subtitle format with speaker voice tags
- **JSON**: Full structured data (transcription + analysis)

### `analyticsService.ts` — Analytics Queries
Runs against local Dexie database:
- Transcriptions by mode/language distribution
- Transcriptions and duration over time
- Sentiment distribution across analyses
- Top topics with mention counts
- Task completion statistics
- Word frequency analysis (with stop word filtering)

### `sharingService.ts` — Sharing
Uses Supabase RPC functions:
- `shareTranscription(id, email)` — Add user to `shared_with` array
- `removeSharedUser(id, userId)` — Remove shared access
- `getSharedTranscriptions()` — List transcriptions shared with current user

---

## Database Schema

### Local Database (Dexie / IndexedDB)

Database name: `VoiceTranscriptorDB`, version 1.

| Table | Primary Key | Indexes |
|-------|------------|---------|
| `transcriptions` | `id` | title, mode, status, language, projectId, folderId, createdAt, updatedAt, isStarred, *tags |
| `analyses` | `id` | transcriptionId, createdAt |
| `audioFiles` | `id` | name, createdAt |
| `tasks` | `id` | status, priority, transcriptionId, owner, dueDate, createdAt, sortOrder |
| `projects` | `id` | name, createdAt |
| `folders` | `id` | name, projectId, parentFolderId |
| `tags` | `id` | name |

---

## Supabase Cloud Schema

### Tables

**`profiles`** — Extends Supabase auth.users
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
display_name TEXT
avatar_url TEXT
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

**`transcriptions`** — Transcription records
```sql
id TEXT PRIMARY KEY
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
title TEXT NOT NULL
mode TEXT NOT NULL DEFAULT 'general'
status TEXT NOT NULL DEFAULT 'idle'
language TEXT DEFAULT 'en'
raw_text TEXT DEFAULT ''
segments JSONB DEFAULT '[]'
detected_language TEXT
detected_mode TEXT
audio_file_url TEXT
audio_duration REAL DEFAULT 0
audio_file_name TEXT
analysis_id TEXT
project_id TEXT
folder_id TEXT
tags TEXT[] DEFAULT '{}'
is_starred BOOLEAN DEFAULT false
is_shared BOOLEAN DEFAULT false
shared_with UUID[] DEFAULT '{}'
created_at BIGINT NOT NULL
updated_at BIGINT NOT NULL
```

**`analyses`** — AI analysis results
```sql
id TEXT PRIMARY KEY
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
transcription_id TEXT NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE
summary TEXT DEFAULT ''
key_topics JSONB DEFAULT '[]'
sentiment JSONB DEFAULT '{}'
action_items JSONB DEFAULT '[]'
decisions JSONB DEFAULT '[]'
meeting_minutes JSONB
follow_ups JSONB DEFAULT '[]'
custom_queries JSONB DEFAULT '[]'
created_at BIGINT NOT NULL
```

**`tasks`** — Task board items
```sql
id TEXT PRIMARY KEY
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
title TEXT NOT NULL
description TEXT
status TEXT NOT NULL DEFAULT 'todo'
priority TEXT NOT NULL DEFAULT 'medium'
owner TEXT
due_date TEXT
transcription_id TEXT REFERENCES transcriptions(id) ON DELETE SET NULL
linked_timestamp REAL
tags TEXT[] DEFAULT '{}'
sort_order INTEGER DEFAULT 0
created_at BIGINT NOT NULL
updated_at BIGINT NOT NULL
completed_at BIGINT
```

**`projects`**, **`folders`**, **`tags`**, **`comments`** — Supporting tables with similar structure.

### Row Level Security (RLS)
All tables have RLS enabled. Policies:
- Users can only read/write their own data (`auth.uid() = user_id`)
- Users can view transcriptions shared with them (`auth.uid() = ANY(shared_with)`)
- Users can view comments on accessible transcriptions

### Triggers
- `handle_new_user()` — Auto-creates a profile row when a new user signs up

### Storage
- Bucket: `audio-files` (private, currently unused — audio stays local)

---

## Type System

### Core Types

```typescript
// Transcription modes
type TranscriptionMode = 'meeting' | 'interview' | 'lecture' | 'phone-call' |
  'podcast' | 'brainstorm' | 'voice-note' | 'legal' | 'medical' | 'general' | 'auto-detect';

// Pipeline stages
type TranscriptionStatus = 'idle' | 'recording' | 'uploading' | 'transcribing' |
  'analyzing' | 'completed' | 'error' | 'queued-offline';

// Task workflow
type TaskStatus = 'todo' | 'in-progress' | 'done';
type TaskPriority = 'high' | 'medium' | 'low';

// Sentiment
type SentimentLabel = 'positive' | 'negative' | 'neutral' | 'mixed';

// Settings
type Theme = 'light' | 'dark' | 'system';
type WhisperModel = 'whisper-1' | 'gpt-4o-transcribe';
type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2 | 2.5 | 3;
```

### Key Interfaces

- **`Transcription`** — id, title, mode, status, language, segments[], rawText, audioFileId, tags, isStarred
- **`TranscriptionSegment`** — id, words[], text, start, end, speaker, bookmarks[], annotations[]
- **`TranscriptionWord`** — text, start, end, confidence, speaker, isEdited
- **`TranscriptionAnalysis`** — summary, keyTopics[], sentiment, actionItems[], decisions[], meetingMinutes, followUps[]
- **`Task`** — title, description, status, priority, owner, dueDate, transcriptionId, sortOrder
- **`AudioFile`** — name, blob (Blob), mimeType, size, duration
- **`Comment`** — userId, transcriptionId, text, timestampRef, parentId
- **`AppSettings`** — All user preferences (API keys, defaults, toggles)

---

## AI Integration

### OpenAI Whisper (Transcription)
- **Endpoint**: `POST /v1/audio/transcriptions`
- **Request**: FormData with audio file, model, response_format=verbose_json, timestamp_granularities
- **Response**: Text + segments with word-level timestamps
- **Error handling**: API key validation, CORS-friendly error messages, network failure detection
- **Models**: `whisper-1` (default, faster) or `gpt-4o-transcribe` (more accurate)

### Anthropic Claude (Analysis)
- **Model**: `claude-sonnet-4-20250514`
- **Header**: `anthropic-dangerous-direct-browser-access: true` (direct browser calls)
- **Functions**:
  1. **analyzeTranscript** — 4096 max tokens, mode-specific system prompt, returns structured JSON
  2. **detectMode** — 200 max tokens, classifies transcript type
  3. **generateTitle** — 60 max tokens, returns 3-7 word title
  4. **customQuery** — 2048 max tokens, ad-hoc Q&A about transcript

### Parallel Processing
Analysis and title generation run concurrently via `Promise.all()` to minimize wait time:
```typescript
const [analysis, smartTitle] = await Promise.all([
  analyzeTranscript({ transcript, mode, apiKey }),
  generateTitle(transcript, mode, apiKey),
]);
```

---

## Audio Processing Pipeline

```
Audio Input (Blob)
    │
    ▼
Save to IndexedDB (audioFiles table)
    │
    ▼
[Optional] Audio Enhancement
    ├── High-pass filter (80Hz cutoff)
    ├── Dynamic compression (-24dB threshold)
    └── Noise gate (-40dB threshold)
    │
    ▼
OpenAI Whisper API
    │
    ▼
Parse Response → Segments + Words
    │
    ▼
Save to IndexedDB (transcriptions table)
    │
    ▼
[If auto-detect] Claude → Detect Mode
    │
    ▼
[Parallel]
    ├── Claude → Full Analysis → Save to analyses table
    └── Claude → Generate Title → Update transcription title
    │
    ▼
Sync to Supabase (non-blocking)
```

---

## Sync Architecture

### Strategy: Local-First with Cloud Sync

1. **Dexie (IndexedDB)** is the primary read/write layer — fast, works offline
2. After every local write, a non-blocking sync pushes to Supabase
3. On app startup (when online + authenticated), `pullTranscriptions()` fetches cloud data
4. **Conflict resolution**: Last-write-wins based on `updatedAt` timestamp
5. **Offline queue**: Operations queued in localStorage when offline, processed on `window.online`

### What syncs to cloud
- Transcription text data (title, rawText, segments, mode, tags, etc.)
- Analysis results
- Tasks

### What stays local-only
- **Audio files** (Blob data in IndexedDB) — not uploaded to save Supabase Storage quota
- **API keys** (in localStorage) — never leave the browser
- **UI preferences** (theme, display settings)

---

## Authentication Flow

```
App Start → useAuthStore.initialize()
    │
    ├── No Supabase configured? → Guest mode (isGuest=true)
    ├── Active session found? → Load user + profile
    └── No session? → Show AuthPage
         │
         ├── Email/Password Sign In
         ├── Email/Password Sign Up (auto-creates profile via trigger)
         ├── Google OAuth
         └── Continue as Guest (local-only mode)
```

**AuthGuard** wraps all protected routes. If no user and not guest, redirects to `/auth`.

**Guest mode** gives full access to all features using local storage only — no cloud sync, no sharing, no collaboration.

---

## Export Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| Plain Text | `.txt` | Readable text with timestamps, speakers, analysis |
| PDF | `.pdf` | Formatted document with sections, auto-pagination |
| Word | `.docx` | Microsoft Word with headings, styled runs |
| SubRip | `.srt` | Standard subtitle format (index, timecodes, text) |
| WebVTT | `.vtt` | Web subtitle format with `<v speaker>` tags |
| JSON | `.json` | Full structured data (transcription + analysis) |

All exports support options: include/exclude timestamps, speakers, analysis.

---

## Collaboration System

### Comments (Real-time)
- Comments are stored in Supabase `comments` table
- Subscribed via Supabase Realtime `postgres_changes` on INSERT/DELETE
- Comments can be anchored to specific audio timestamps (`timestampRef`)
- Optimistic updates with rollback on failure
- Threaded comments via `parentId`

### Sharing
- Share by email — looks up user via Supabase RPC function
- Adds target user UUID to `shared_with` array on transcription
- RLS policy allows shared users to SELECT the transcription
- Shared transcriptions appear in "Shared with me" section

---

## PWA Configuration

Configured via `vite-plugin-pwa` in `vite.config.ts`:

- **Register type**: `prompt` (user prompted to update)
- **Manifest**: name, icons (192px + 512px), theme color (#6366f1), dark background
- **Display**: `standalone` (app-like, no browser chrome)
- **Workbox**: Caches JS, CSS, HTML, images, fonts
- **Icons**: Generated from SVG using `sharp-cli`

---

## Deployment

### Netlify

The app is deployed to Netlify with this configuration (`netlify.toml`):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Environment variables** set in Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Supabase Auth redirect URL** configured:
- `https://voice-transcriptor-ai.netlify.app/**`

### Manual Deploy Steps
1. Push to GitHub (`master` branch)
2. Netlify auto-builds from repo (or trigger manually)
3. Build: `npm run build` → outputs to `dist/`
4. SPA redirect ensures client-side routing works

---

## Configuration Files

### `vite.config.ts`
- React plugin with Babel
- Tailwind CSS v4 Vite plugin
- PWA plugin with manifest and workbox config
- Path alias: `@` → `./src`

### `tsconfig.json`
- Composite TypeScript config
- References `tsconfig.app.json` and `tsconfig.node.json`

### `eslint.config.js`
- TypeScript ESLint with recommended rules
- React hooks and React refresh plugins

### `.gitignore`
- Ignores: node_modules, dist, .env files, editor configs

---

## Language Support

The app supports 50+ languages grouped into 5 regions:
- **Indian** (15): Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Nepali, Sinhala, Sanskrit
- **European** (18): English, Spanish, French, German, Italian, Portuguese, Russian, Dutch, Polish, Ukrainian, Czech, Swedish, Danish, Finnish, Norwegian, Greek, Romanian, Hungarian
- **Asian** (9): Chinese, Japanese, Korean, Thai, Vietnamese, Indonesian, Malay, Filipino, Myanmar
- **Middle Eastern** (4): Arabic, Persian, Turkish, Hebrew
- **Other** (2): Swahili, Afrikaans

---

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_FILE_SIZE` | 500 MB | Maximum upload file size |
| `WHISPER_MAX_SIZE` | 25 MB | Whisper API limit |
| `SPEAKER_COLORS` | 12 colors | Color palette for speaker labels |
| `PLAYBACK_SPEEDS` | 0.5–3x | Available playback speeds |
| `APP_VERSION` | 1.0.0 | Current app version |
