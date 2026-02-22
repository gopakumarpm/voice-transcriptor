import { create } from 'zustand';
import type { PlaybackSpeed } from '@/types';

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: PlaybackSpeed;
  volume: number;
  isMuted: boolean;
  activeTranscriptionId: string | null;

  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  loadTranscription: (id: string) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  speed: 1,
  volume: 0.8,
  isMuted: false,
  activeTranscriptionId: null,

  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setSpeed: (speed) => set({ speed }),
  setVolume: (volume) => set({ volume }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  loadTranscription: (id) => set({ activeTranscriptionId: id, currentTime: 0, isPlaying: false }),
  reset: () => set({ isPlaying: false, currentTime: 0, duration: 0, activeTranscriptionId: null }),
}));
