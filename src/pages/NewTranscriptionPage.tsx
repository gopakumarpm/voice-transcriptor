import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Button, Card, ProgressBar, Select } from '@/components/ui';
import { useRecordingStore } from '@/stores/useRecordingStore';
import { useTranscriptionStore } from '@/stores/useTranscriptionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUIStore } from '@/stores/useUIStore';
import { TRANSCRIPTION_MODES } from '@/config/transcriptionModes';
import { LANGUAGES, LANGUAGE_GROUPS } from '@/config/languages';
import { SUPPORTED_EXTENSIONS, MAX_FILE_SIZE } from '@/config/constants';
import { formatDuration, formatFileSize } from '@/utils/formatters';
import type { TranscriptionMode, WhisperModel } from '@/types';
import {
  Mic, Square, Pause, Play, X, Sparkles, Users, UserCheck,
  GraduationCap, Phone, Headphones, Lightbulb, FileText, Scale,
  Stethoscope, CloudUpload, Wand2, Cpu
} from 'lucide-react';

const modeIcons: Record<string, React.ReactNode> = {
  Users: <Users className="w-6 h-6" />,
  UserCheck: <UserCheck className="w-6 h-6" />,
  GraduationCap: <GraduationCap className="w-6 h-6" />,
  Phone: <Phone className="w-6 h-6" />,
  Headphones: <Headphones className="w-6 h-6" />,
  Lightbulb: <Lightbulb className="w-6 h-6" />,
  Mic: <Mic className="w-6 h-6" />,
  Scale: <Scale className="w-6 h-6" />,
  Stethoscope: <Stethoscope className="w-6 h-6" />,
  FileText: <FileText className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
};

export function NewTranscriptionPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { status: recStatus, duration, audioLevel, startRecording, pauseRecording, resumeRecording, stopRecording, cancelRecording } = useRecordingStore();
  const { status: txStatus, progress, progressMessage, selectedMode, selectedLanguage, setMode, setLanguage, startTranscription, error } = useTranscriptionStore();
  const { openaiApiKey, anthropicApiKey, enableAudioEnhancement, whisperModel, updateSettings } = useSettingsStore();
  const { showToast } = useUIStore();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const isProcessing = txStatus === 'uploading' || txStatus === 'transcribing' || txStatus === 'analyzing';

  // ─── File Upload ───
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      showToast({ type: 'error', title: 'Unsupported format', description: `Supported: ${SUPPORTED_EXTENSIONS.join(', ')}` });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast({ type: 'error', title: 'File too large', description: `Max size: ${formatFileSize(MAX_FILE_SIZE)}` });
      return;
    }
    setUploadedFile(file);
  }, [showToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // ─── Start Transcription ───
  const handleStart = async (blob: Blob, name: string) => {
    if (!openaiApiKey) {
      showToast({ type: 'error', title: 'OpenAI API key required', description: 'Go to Settings → API Keys to add your key' });
      navigate('/settings');
      return;
    }
    try {
      console.log('[VT] Starting transcription for:', name, 'blob size:', blob.size);
      const id = await startTranscription(blob, name, openaiApiKey, anthropicApiKey);
      showToast({ type: 'success', title: 'Transcription complete!' });
      navigate(`/transcription/${id}`);
    } catch (err) {
      console.error('[VT] Transcription error in UI:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast({ type: 'error', title: 'Transcription failed', description: msg });
    }
  };

  const handleRecordStop = async () => {
    const blob = await stopRecording();
    if (blob) {
      const now = new Date();
      const name = `Recording ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      await handleStart(blob, name);
    }
  };

  const handleUploadStart = async () => {
    if (!uploadedFile) return;
    await handleStart(uploadedFile, uploadedFile.name);
  };

  // ─── Language options ───
  const languageOptions = [
    { value: 'auto', label: 'Auto-detect language' },
    ...Object.entries(LANGUAGE_GROUPS).flatMap(([key, groupLabel]) =>
      LANGUAGES.filter((l) => l.group === key).map((l) => ({
        value: l.code,
        label: `${l.name} (${l.nativeName})`,
        group: groupLabel,
      }))
    ),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
      {/* Mode Selection */}
      <section>
        <h2 className="text-lg font-semibold mb-4">What are you transcribing?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {(Object.entries(TRANSCRIPTION_MODES) as [TranscriptionMode, typeof TRANSCRIPTION_MODES[TranscriptionMode]][]).map(([key, mode]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              disabled={isProcessing}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-center',
                selectedMode === key
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/10'
                  : 'border-transparent glass glass-hover'
              )}
            >
              <div style={{ color: mode.color }}>{modeIcons[mode.icon] || <FileText className="w-6 h-6" />}</div>
              <span className="text-sm font-medium">{mode.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Language & Options */}
      <section className="flex flex-wrap items-end gap-6">
        <div className="w-64">
          <Select
            label="Language"
            value={selectedLanguage}
            onChange={(e) => setLanguage(e.target.value)}
            options={languageOptions}
            disabled={isProcessing}
          />
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[var(--text-muted)]" />
          <div className="flex rounded-xl overflow-hidden border border-surface-300 dark:border-surface-700">
            {([
              { id: 'whisper-1' as WhisperModel, label: 'Whisper-1' },
              { id: 'gpt-4o-transcribe' as WhisperModel, label: 'GPT-4o' },
            ]).map((m) => (
              <button
                key={m.id}
                onClick={() => updateSettings({ whisperModel: m.id })}
                disabled={isProcessing}
                className={cn(
                  'px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                  whisperModel === m.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-transparent hover:bg-surface-200/50 dark:hover:bg-surface-800/50'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Enhancement Toggle */}
        <button
          onClick={() => updateSettings({ enableAudioEnhancement: !enableAudioEnhancement })}
          disabled={isProcessing}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer',
            enableAudioEnhancement
              ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400 border border-accent-500/30'
              : 'glass glass-hover border border-transparent'
          )}
        >
          <Wand2 className="w-4 h-4" />
          Enhance Audio
        </button>
      </section>

      {/* Recording Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Record or Upload</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Live Recording */}
          <Card className="flex flex-col items-center py-8 space-y-6">
            <h3 className="font-medium text-[var(--text-secondary)]">Record Live</h3>

            {/* Waveform visualization */}
            {recStatus !== 'idle' && (
              <div className="flex items-center gap-1 h-12">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-primary-500 transition-all duration-150"
                    style={{
                      height: `${Math.max(4, audioLevel * 48 * (0.5 + Math.random() * 0.5))}px`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Timer */}
            {recStatus !== 'idle' && (
              <p className="text-3xl font-mono font-bold tabular-nums">{formatDuration(duration)}</p>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
              {recStatus === 'idle' ? (
                <button
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-8 h-8 text-white" />
                </button>
              ) : (
                <>
                  {recStatus === 'recording' ? (
                    <button onClick={pauseRecording} className="w-14 h-14 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center hover:bg-surface-300 dark:hover:bg-surface-700 transition-colors cursor-pointer">
                      <Pause className="w-6 h-6" />
                    </button>
                  ) : (
                    <button onClick={resumeRecording} className="w-14 h-14 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center hover:bg-surface-300 dark:hover:bg-surface-700 transition-colors cursor-pointer">
                      <Play className="w-6 h-6" />
                    </button>
                  )}
                  <button
                    onClick={handleRecordStop}
                    className="w-20 h-20 rounded-full bg-danger-500 flex items-center justify-center shadow-lg shadow-danger-500/30 hover:bg-danger-600 transition-all pulse-recording cursor-pointer"
                  >
                    <Square className="w-8 h-8 text-white" />
                  </button>
                  <button onClick={cancelRecording} className="w-14 h-14 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center hover:bg-surface-300 dark:hover:bg-surface-700 transition-colors cursor-pointer">
                    <X className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </Card>

          {/* File Upload */}
          <Card
            className={cn(
              'flex flex-col items-center justify-center py-8 space-y-4 border-2 border-dashed transition-colors',
              dragOver ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-transparent'
            )}
            onClick={() => !uploadedFile && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_EXTENSIONS.join(',')}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={isProcessing}
            />

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="flex flex-col items-center w-full"
            >
              {uploadedFile ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8 text-accent-500" />
                  </div>
                  <p className="font-medium truncate max-w-[200px]">{uploadedFile.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">{formatFileSize(uploadedFile.size)}</p>
                  <div className="flex gap-3 mt-4">
                    <Button onClick={handleUploadStart} disabled={isProcessing} loading={isProcessing}>
                      Transcribe
                    </Button>
                    <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}>
                      Remove
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-surface-200/50 dark:bg-surface-800/50 flex items-center justify-center mb-3">
                    <CloudUpload className="w-8 h-8 text-[var(--text-muted)]" />
                  </div>
                  <p className="font-medium">Drop audio file here</p>
                  <p className="text-sm text-[var(--text-muted)]">or click to browse</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">MP3, WAV, M4A, OGG, FLAC, WebM, AAC</p>
                </>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Progress */}
      {isProcessing && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">{progressMessage || 'Processing...'}</p>
            <span className="text-sm text-[var(--text-muted)]">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} />
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border border-danger-500/30 bg-danger-500/5">
          <p className="text-danger-500 text-sm">{error}</p>
        </Card>
      )}
    </div>
  );
}
