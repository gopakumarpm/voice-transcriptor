export const APP_NAME = 'Voice Transcriptor';
export const APP_VERSION = '1.0.0';

export const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg',       // MP3
  'audio/wav',        // WAV
  'audio/x-wav',
  'audio/mp4',        // M4A
  'audio/x-m4a',
  'audio/ogg',        // OGG
  'audio/flac',       // FLAC
  'audio/webm',       // WebM
  'audio/aac',        // AAC
] as const;

export const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.webm', '.aac'];

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
export const WHISPER_MAX_SIZE = 25 * 1024 * 1024; // 25 MB

export const SPEAKER_COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#14b8a6', '#ef4444',
  '#84cc16', '#06b6d4', '#f97316', '#a855f7',
];

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3] as const;
