import { create } from 'zustand';
import type { TranscriptionMode, TranscriptionStatus, Transcription } from '@/types';
import { db } from '@/db';
import { generateId } from '@/utils/idGenerator';
import { transcribeAudio } from '@/services/whisper';
import { analyzeTranscript, detectMode, generateTitle } from '@/services/claude';
import { syncTranscription, syncAnalysis } from '@/services/syncService';
import { enhanceAudio } from '@/services/audioEnhancer';
import { useSettingsStore } from './useSettingsStore';

interface TranscriptionState {
  currentId: string | null;
  status: TranscriptionStatus;
  progress: number;
  progressMessage: string;
  selectedMode: TranscriptionMode;
  selectedLanguage: string;
  error: string | null;

  setMode: (mode: TranscriptionMode) => void;
  setLanguage: (lang: string) => void;
  startTranscription: (audioBlob: Blob, fileName: string, openaiKey: string, anthropicKey: string) => Promise<string>;
  runAnalysis: (transcriptionId: string, anthropicKey: string) => Promise<void>;
  setStatus: (status: TranscriptionStatus) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useTranscriptionStore = create<TranscriptionState>((set, get) => ({
  currentId: null,
  status: 'idle',
  progress: 0,
  progressMessage: '',
  selectedMode: 'auto-detect',
  selectedLanguage: 'en',
  error: null,

  setMode: (mode) => set({ selectedMode: mode }),
  setLanguage: (lang) => set({ selectedLanguage: lang }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  reset: () => set({ currentId: null, status: 'idle', progress: 0, progressMessage: '', error: null }),

  startTranscription: async (audioBlob, fileName, openaiKey, anthropicKey) => {
    const id = generateId();
    const { selectedMode, selectedLanguage } = get();

    try {
      console.log('[VT] Starting transcription:', { fileName, blobSize: audioBlob.size, blobType: audioBlob.type, selectedMode, selectedLanguage });

      // Save audio file
      set({ status: 'uploading', progress: 10, progressMessage: 'Saving audio...', currentId: id, error: null });

      const audioFileId = generateId();
      const duration = await getAudioDuration(audioBlob);
      await db.audioFiles.add({
        id: audioFileId,
        name: fileName,
        blob: audioBlob,
        mimeType: audioBlob.type || 'audio/webm',
        size: audioBlob.size,
        duration,
        createdAt: Date.now(),
      });

      // Create transcription record
      const transcription: Transcription = {
        id,
        title: fileName.replace(/\.[^.]+$/, '') || `Recording ${new Date().toLocaleDateString()}`,
        mode: selectedMode,
        status: 'transcribing',
        language: selectedLanguage,
        segments: [],
        rawText: '',
        audioFileId,
        audioDuration: duration,
        audioFileName: fileName,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isStarred: false,
      };
      await db.transcriptions.add(transcription);

      // Audio stays local-only (IndexedDB) — no cloud upload to save storage

      // Enhance audio if enabled
      const { enableAudioEnhancement, whisperModel } = useSettingsStore.getState();
      let processedBlob = audioBlob;
      if (enableAudioEnhancement) {
        set({ progress: 20, progressMessage: 'Enhancing audio...' });
        processedBlob = await enhanceAudio(audioBlob);
      }

      // Transcribe with Whisper
      console.log('[VT] Audio saved, starting Whisper transcription...');
      set({ status: 'transcribing', progress: 30, progressMessage: 'Transcribing audio...' });

      const result = await transcribeAudio({
        audioBlob: processedBlob,
        language: selectedLanguage === 'auto' ? undefined : selectedLanguage,
        apiKey: openaiKey,
        enableDiarization: selectedMode !== 'voice-note' && selectedMode !== 'lecture',
        onProgress: (p) => set({ progress: 30 + p * 0.4 }),
        model: whisperModel,
      });

      // Update transcription with results
      await db.transcriptions.update(id, {
        segments: result.segments,
        rawText: result.text,
        detectedLanguage: result.language,
        status: 'analyzing',
        updatedAt: Date.now(),
      });

      set({ progress: 70, progressMessage: 'Analyzing with AI...' });

      // Auto-detect mode if needed
      let finalMode = selectedMode;
      if (selectedMode === 'auto-detect' && anthropicKey) {
        const detected = await detectMode(result.text.slice(0, 3000), anthropicKey);
        finalMode = detected.mode;
        await db.transcriptions.update(id, { detectedMode: finalMode });
      }

      // Run analysis and generate smart title if API key available
      if (anthropicKey) {
        set({ status: 'analyzing', progress: 80, progressMessage: 'Generating insights...' });

        // Run analysis and title generation in parallel
        const effectiveMode = finalMode === 'auto-detect' ? 'general' : finalMode;
        const [analysis, smartTitle] = await Promise.all([
          analyzeTranscript({ transcript: result.text, mode: effectiveMode, apiKey: anthropicKey }),
          generateTitle(result.text, effectiveMode, anthropicKey),
        ]);

        analysis.transcriptionId = id;
        await db.analyses.add(analysis);
        await db.transcriptions.update(id, {
          analysisId: analysis.id,
          ...(smartTitle ? { title: smartTitle } : {}),
        });
        syncAnalysis(analysis).catch(() => {});
      }

      await db.transcriptions.update(id, { status: 'completed', updatedAt: Date.now() });
      set({ status: 'completed', progress: 100, progressMessage: 'Done!' });

      // Sync to cloud (non-blocking)
      const finalTranscription = await db.transcriptions.get(id);
      if (finalTranscription) syncTranscription(finalTranscription).catch(() => {});

      return id;
    } catch (err) {
      console.error('[VT] Transcription failed:', err);
      const msg = err instanceof Error ? err.message : 'Transcription failed';
      await db.transcriptions.update(id, { status: 'error', updatedAt: Date.now() }).catch(() => {});
      set({ status: 'error', error: msg, progressMessage: '' });
      throw err;
    }
  },

  runAnalysis: async (transcriptionId, anthropicKey) => {
    const transcription = await db.transcriptions.get(transcriptionId);
    if (!transcription) throw new Error('Transcription not found');

    set({ status: 'analyzing', progress: 50, progressMessage: 'Analyzing...' });
    const mode = transcription.detectedMode || transcription.mode;
    const analysis = await analyzeTranscript({
      transcript: transcription.rawText,
      mode: mode === 'auto-detect' ? 'general' : mode,
      apiKey: anthropicKey,
    });
    analysis.transcriptionId = transcriptionId;

    // Remove old analysis if exists
    if (transcription.analysisId) {
      await db.analyses.delete(transcription.analysisId).catch(() => {});
    }

    await db.analyses.add(analysis);
    await db.transcriptions.update(transcriptionId, { analysisId: analysis.id, updatedAt: Date.now() });
    set({ status: 'completed', progress: 100, progressMessage: 'Analysis complete' });
  },
}));

function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    // Timeout after 3s — WebM blobs from MediaRecorder often report Infinity or never fire loadedmetadata
    const timeout = setTimeout(() => {
      console.warn('[VT] Audio duration detection timed out, using 0');
      resolve(0);
    }, 3000);

    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);
      const dur = audio.duration;
      resolve(dur && isFinite(dur) ? dur : 0);
      URL.revokeObjectURL(audio.src);
    });
    audio.addEventListener('error', () => {
      clearTimeout(timeout);
      console.warn('[VT] Audio duration detection error');
      resolve(0);
      URL.revokeObjectURL(audio.src);
    });
    audio.preload = 'metadata';
    audio.src = URL.createObjectURL(blob);
  });
}
