import { create } from 'zustand';
import type { AppSettings, Theme, WhisperModel } from '@/types';
import type { TranscriptionMode } from '@/types/transcription';
import type { PlaybackSpeed } from '@/types/audio';

const STORAGE_KEY = 'vt-settings';

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...getDefaults(), ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return getDefaults();
}

function getDefaults(): AppSettings {
  return {
    openaiApiKey: '',
    anthropicApiKey: '',
    defaultLanguage: 'en',
    defaultMode: 'auto-detect' as TranscriptionMode,
    enableAutoDetect: true,
    autoDetectDuration: 90,
    defaultPlaybackSpeed: 1 as PlaybackSpeed,
    skipSilence: false,
    theme: 'dark' as Theme,
    fontSize: 'medium',
    showConfidence: true,
    showTimestamps: true,
    showSpeakerLabels: true,
    enableNotifications: true,
    hasCompletedOnboarding: false,
    enableAudioEnhancement: false,
    whisperModel: 'whisper-1' as WhisperModel,
    enableCloudSync: true,
  };
}

interface SettingsState extends AppSettings {
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...loadSettings(),

  updateSettings: (partial) => {
    set((state) => {
      const updated = { ...state, ...partial };
      const { updateSettings: _u, resetSettings: _r, ...toSave } = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      return partial;
    });
  },

  resetSettings: () => {
    const defaults = getDefaults();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    set(defaults);
  },
}));
