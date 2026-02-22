import { create } from 'zustand';

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'processing';

interface RecordingState {
  status: RecordingStatus;
  duration: number;
  audioLevel: number;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  stream: MediaStream | null;
  analyser: AnalyserNode | null;
  timerInterval: ReturnType<typeof setInterval> | null;

  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  setAudioLevel: (level: number) => void;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
  status: 'idle',
  duration: 0,
  audioLevel: 0,
  mediaRecorder: null,
  audioChunks: [],
  stream: null,
  analyser: null,
  timerInterval: null,

  startRecording: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.start(1000);

      const interval = setInterval(() => {
        set((s) => ({ duration: s.duration + 1 }));

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        set({ audioLevel: avg / 255 });
      }, 1000);

      set({
        status: 'recording',
        mediaRecorder,
        audioChunks: chunks,
        stream,
        analyser,
        timerInterval: interval,
        duration: 0,
      });
    } catch (err) {
      console.error('Failed to start recording:', err);
      throw err;
    }
  },

  pauseRecording: () => {
    const { mediaRecorder, timerInterval } = get();
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.pause();
      if (timerInterval) clearInterval(timerInterval);
      set({ status: 'paused', timerInterval: null });
    }
  },

  resumeRecording: () => {
    const { mediaRecorder, analyser } = get();
    if (mediaRecorder?.state === 'paused') {
      mediaRecorder.resume();
      const interval = setInterval(() => {
        set((s) => ({ duration: s.duration + 1 }));
        if (analyser) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          set({ audioLevel: avg / 255 });
        }
      }, 1000);
      set({ status: 'recording', timerInterval: interval });
    }
  },

  stopRecording: () => {
    return new Promise<Blob | null>((resolve) => {
      const { mediaRecorder, stream, timerInterval, audioChunks } = get();
      if (!mediaRecorder) { resolve(null); return; }

      if (timerInterval) clearInterval(timerInterval);

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        stream?.getTracks().forEach((t) => t.stop());
        set({
          status: 'idle',
          mediaRecorder: null,
          audioChunks: [],
          stream: null,
          analyser: null,
          timerInterval: null,
          audioLevel: 0,
        });
        resolve(blob);
      };

      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      } else {
        resolve(null);
      }
    });
  },

  cancelRecording: () => {
    const { mediaRecorder, stream, timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);
    if (mediaRecorder?.state !== 'inactive') mediaRecorder?.stop();
    stream?.getTracks().forEach((t) => t.stop());
    set({
      status: 'idle',
      mediaRecorder: null,
      audioChunks: [],
      stream: null,
      analyser: null,
      timerInterval: null,
      duration: 0,
      audioLevel: 0,
    });
  },

  setAudioLevel: (level) => set({ audioLevel: level }),
}));
