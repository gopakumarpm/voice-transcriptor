import { create } from 'zustand';
import type { AppSettings, Theme, WhisperModel } from '@/types';
import type { TranscriptionMode } from '@/types/transcription';
import type { PlaybackSpeed } from '@/types/audio';
import { saveApiKeysToCloud, loadApiKeysFromCloud } from '@/services/syncService';

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
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
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
  loadCloudApiKeys: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadSettings(),

  updateSettings: (partial) => {
    set((state) => {
      const updated = { ...state, ...partial };
      const { updateSettings: _u, resetSettings: _r, loadCloudApiKeys: _l, ...toSave } = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      return partial;
    });

    // Sync API keys to cloud when they change
    if (partial.openaiApiKey !== undefined || partial.anthropicApiKey !== undefined) {
      const state = get();
      const openai = partial.openaiApiKey ?? state.openaiApiKey;
      const anthropic = partial.anthropicApiKey ?? state.anthropicApiKey;
      saveApiKeysToCloud(openai, anthropic).catch(() => {});
    }
  },

  resetSettings: () => {
    const defaults = getDefaults();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    set(defaults);
  },

  loadCloudApiKeys: async () => {
    const keys = await loadApiKeysFromCloud();
    if (!keys) return;

    const state = get();

    // If local has keys but cloud doesn't, push local → cloud
    if ((state.openaiApiKey && !keys.openaiApiKey) || (state.anthropicApiKey && !keys.anthropicApiKey)) {
      saveApiKeysToCloud(state.openaiApiKey, state.anthropicApiKey).catch(() => {});
      console.log('[VT Settings] API keys pushed to cloud');
      return;
    }

    // If cloud has keys but local doesn't, pull cloud → local
    const updates: Partial<AppSettings> = {};
    if (!state.openaiApiKey && keys.openaiApiKey) {
      updates.openaiApiKey = keys.openaiApiKey;
    }
    if (!state.anthropicApiKey && keys.anthropicApiKey) {
      updates.anthropicApiKey = keys.anthropicApiKey;
    }

    if (Object.keys(updates).length > 0) {
      set(updates);
      const { updateSettings: _u, resetSettings: _r, loadCloudApiKeys: _l, ...toSave } = { ...state, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      console.log('[VT Settings] API keys loaded from cloud');
    }
  },
}));
