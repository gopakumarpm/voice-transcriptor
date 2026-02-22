# Voice Transcriptor

AI-powered voice transcription and analysis PWA built with React, TypeScript, and Supabase.

**Live**: [voice-transcriptor-ai.netlify.app](https://voice-transcriptor-ai.netlify.app)

## Features

- **Live Recording & File Upload** - Record directly or upload MP3, WAV, M4A, OGG, FLAC, WebM, AAC
- **AI Transcription** - Powered by OpenAI Whisper (whisper-1 or gpt-4o-transcribe)
- **Smart Analysis** - Claude AI generates summaries, key topics, sentiment, action items, and decisions
- **Auto Mode Detection** - Automatically detects meeting, interview, lecture, podcast, and more
- **Audio Enhancement** - Noise gate, high-pass filter, and volume normalization via Web Audio API
- **Task Management** - Kanban board with tasks extracted from transcriptions
- **Projects & Folders** - Organize transcriptions into projects and folders
- **Analytics Dashboard** - Charts for transcription trends, duration, mode distribution, sentiment
- **Search** - Full-text search across all transcriptions
- **Real-time Collaboration** - Share transcriptions, comments anchored to audio timestamps
- **Cloud Sync** - Supabase-backed sync across devices (offline-first with IndexedDB)
- **API Key Sync** - Enter API keys once, they sync to all your devices via your Supabase profile
- **PWA** - Installable, works offline, responsive on mobile and desktop
- **Dark/Light/System Theme** - Glassmorphism UI with Tailwind CSS v4

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Local DB | Dexie (IndexedDB) |
| Cloud | Supabase (Auth, Postgres, Storage, Realtime) |
| AI | OpenAI Whisper API + Anthropic Claude API |
| Charts | Recharts |
| PWA | vite-plugin-pwa (Workbox) |
| Hosting | Netlify |

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key (for transcription)
- Anthropic API key (for AI analysis) - optional
- Supabase project (for cloud sync, auth, collaboration) - optional

### Installation

```bash
git clone https://github.com/gopakumarpm/voice-transcriptor.git
cd voice-transcriptor
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# Required for cloud features (auth, sync, collaboration)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional - API keys can also be set in the app's Settings page
VITE_OPENAI_API_KEY=
VITE_ANTHROPIC_API_KEY=
```

> **Note**: API keys set via env vars are baked into the client bundle at build time. For deployed apps, prefer entering keys through the Settings page (stored in localStorage and synced via Supabase).

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from the plan (creates tables for profiles, transcriptions, analyses, tasks, projects, folders, tags, comments with RLS policies)
3. Enable Google OAuth in Supabase Auth settings (optional)
4. Create a Storage bucket named `audio-files` (private)

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Deploy to Netlify

```bash
npx netlify deploy --prod --dir=dist
```

## Project Structure

```
src/
  components/
    auth/           # AuthGuard, UserMenu
    collaboration/  # CommentThread, CommentInput
    layout/         # AppShell, Sidebar, Header
    sharing/        # ShareDialog
    ui/             # Button, Card, Tabs, Toggle, etc.
  config/           # Constants, languages, transcription modes
  db/               # Dexie (IndexedDB) schema
  lib/              # Supabase client
  pages/            # Dashboard, NewTranscription, TranscriptionDetail,
                    #   TaskBoard, Projects, Analytics, Search, Settings, Auth
  services/         # Whisper, Claude, audioEnhancer, syncService, sharingService, analyticsService
  stores/           # Zustand stores (auth, settings, transcription, recording, task, UI, collaboration)
  types/            # TypeScript type definitions
  utils/            # Helpers (cn, formatters, idGenerator, export)
```

## How It Works

1. **Record or upload** audio on the New Transcription page
2. Audio is **enhanced** (optional: noise reduction, filtering, compression)
3. **Whisper API** transcribes audio to text with word-level timestamps
4. **Claude AI** analyzes the transcript: summary, topics, sentiment, action items
5. Results are saved to **IndexedDB** (local) and **Supabase** (cloud sync)
6. View, search, share, and collaborate on transcriptions

## API Key Management

- API keys are stored in your browser's **localStorage** (never sent to our servers)
- When signed in, keys are synced to your **Supabase profile** (encrypted by RLS)
- Sign in on any device and keys are automatically pulled from the cloud
- Keys entered locally always take priority over cloud keys

## License

MIT
