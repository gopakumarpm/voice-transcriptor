import type { TranscriptionMode } from './transcription';
import type { PlaybackSpeed } from './audio';

export type Theme = 'light' | 'dark' | 'system';

export type WhisperModel = 'whisper-1' | 'gpt-4o-transcribe';

export interface AppSettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  defaultLanguage: string;
  defaultMode: TranscriptionMode;
  enableAutoDetect: boolean;
  autoDetectDuration: number;
  defaultPlaybackSpeed: PlaybackSpeed;
  skipSilence: boolean;
  theme: Theme;
  fontSize: 'small' | 'medium' | 'large';
  showConfidence: boolean;
  showTimestamps: boolean;
  showSpeakerLabels: boolean;
  enableNotifications: boolean;
  hasCompletedOnboarding: boolean;
  enableAudioEnhancement: boolean;
  whisperModel: WhisperModel;
  enableCloudSync: boolean;
}
