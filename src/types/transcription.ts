export type TranscriptionMode =
  | 'meeting'
  | 'interview'
  | 'lecture'
  | 'phone-call'
  | 'podcast'
  | 'brainstorm'
  | 'voice-note'
  | 'legal'
  | 'medical'
  | 'general'
  | 'auto-detect';

export type TranscriptionStatus =
  | 'idle'
  | 'recording'
  | 'uploading'
  | 'transcribing'
  | 'analyzing'
  | 'completed'
  | 'error'
  | 'queued-offline';

export interface TranscriptionWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
  isEdited: boolean;
  originalText?: string;
}

export interface Bookmark {
  id: string;
  timestamp: number;
  label: string;
  color: string;
  createdAt: number;
}

export interface Annotation {
  id: string;
  startWordIndex: number;
  endWordIndex: number;
  text: string;
  color: string;
  createdAt: number;
}

export interface TranscriptionSegment {
  id: string;
  words: TranscriptionWord[];
  text: string;
  start: number;
  end: number;
  speaker?: string;
  bookmarks: Bookmark[];
  annotations: Annotation[];
}

export interface Transcription {
  id: string;
  title: string;
  mode: TranscriptionMode;
  detectedMode?: TranscriptionMode;
  status: TranscriptionStatus;
  language: string;
  detectedLanguage?: string;
  segments: TranscriptionSegment[];
  rawText: string;
  audioFileId?: string;
  audioFileUrl?: string;
  audioDuration: number;
  audioFileName?: string;
  projectId?: string;
  folderId?: string;
  tags: string[];
  analysisId?: string;
  createdAt: number;
  updatedAt: number;
  isStarred: boolean;
}
