import type { TranscriptionSegment, TranscriptionWord, WhisperModel } from '@/types';
import { generateId } from '@/utils/idGenerator';

interface WhisperResponse {
  text: string;
  segments: TranscriptionSegment[];
  language?: string;
}

interface TranscribeParams {
  audioBlob: Blob;
  language?: string;
  apiKey: string;
  enableDiarization: boolean;
  onProgress?: (progress: number) => void;
  model?: WhisperModel;
}

export async function transcribeAudio(params: TranscribeParams): Promise<WhisperResponse> {
  const { audioBlob, language, onProgress } = params;
  const apiKey = params.apiKey?.trim();

  if (!apiKey) {
    throw new Error('OpenAI API key is required. Add it in Settings.');
  }

  // Validate API key format
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. Key should start with "sk-". Check Settings → API Keys.');
  }

  // Quick auth check before uploading audio (uses GET, simpler CORS)
  try {
    const authCheck = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!authCheck.ok) {
      console.error('[VT] API key validation failed:', authCheck.status);
      throw new Error('Invalid OpenAI API key. Please check your key in Settings → API Keys.');
    }
  } catch (authErr) {
    if (authErr instanceof Error && authErr.message.includes('Invalid OpenAI API key')) {
      throw authErr;
    }
    console.warn('[VT] Auth pre-check failed (may be network issue):', authErr);
    // Continue anyway — the main request will give us a clearer error
  }

  const formData = new FormData();

  // Convert blob to proper file with extension
  const ext = getExtension(audioBlob.type);
  const fileName = `audio.${ext}`;
  const file = new File([audioBlob], fileName, { type: audioBlob.type || 'audio/webm' });

  console.log('[VT] Whisper request:', { fileName, size: file.size, type: file.type, language, keyPrefix: apiKey.slice(0, 7) + '...' });

  const selectedModel = params.model || 'whisper-1';

  formData.append('file', file);
  formData.append('model', selectedModel);
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  formData.append('timestamp_granularities[]', 'segment');

  if (language && language !== 'auto') {
    formData.append('language', language);
  }

  onProgress?.(0.1);

  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });
  } catch (networkErr) {
    console.error('[VT] Whisper fetch error:', networkErr);
    // When OpenAI returns 401, CORS blocks reading the response,
    // causing fetch() to throw TypeError instead of returning response.
    // Detect this and provide a helpful message.
    throw new Error(
      'Request to OpenAI failed. This is most likely an invalid API key. ' +
      'Please verify your OpenAI API key in Settings → API Keys, and make sure it has not been revoked.'
    );
  }

  onProgress?.(0.7);

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const errMsg = (errBody as { error?: { message?: string } }).error?.message || `Whisper API error: ${response.status}`;
    console.error('[VT] Whisper API error:', response.status, errBody);
    if (response.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your key in Settings → API Keys.');
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  console.log('[VT] Whisper response received:', { textLength: (data.text || '').length, language: data.language, segmentCount: (data.segments || []).length });

  onProgress?.(0.9);

  const segments = parseWhisperResponse(data);
  onProgress?.(1.0);

  return {
    text: data.text || '',
    segments,
    language: data.language,
  };
}

function parseWhisperResponse(data: Record<string, unknown>): TranscriptionSegment[] {
  const rawSegments = (data.segments || []) as Array<{
    id?: number;
    text?: string;
    start?: number;
    end?: number;
    words?: Array<{ word?: string; start?: number; end?: number }>;
  }>;
  const rawWords = (data.words || []) as Array<{
    word?: string;
    start?: number;
    end?: number;
  }>;

  // If we have segment-level data with words
  if (rawSegments.length > 0) {
    return rawSegments.map((seg) => {
      const segWords: TranscriptionWord[] = (seg.words || []).map((w) => ({
        text: (w.word || '').trim(),
        start: w.start || 0,
        end: w.end || 0,
        confidence: 1,
        isEdited: false,
      }));

      // If no words in segment but we have global words, match by timestamp
      if (segWords.length === 0 && rawWords.length > 0) {
        const matched = rawWords.filter(
          (w) => (w.start || 0) >= (seg.start || 0) && (w.end || 0) <= (seg.end || 0)
        );
        segWords.push(
          ...matched.map((w) => ({
            text: (w.word || '').trim(),
            start: w.start || 0,
            end: w.end || 0,
            confidence: 1,
            isEdited: false,
          }))
        );
      }

      return {
        id: generateId(),
        words: segWords,
        text: (seg.text || '').trim(),
        start: seg.start || 0,
        end: seg.end || 0,
        bookmarks: [],
        annotations: [],
      };
    });
  }

  // Fallback: create single segment from words
  if (rawWords.length > 0) {
    const words: TranscriptionWord[] = rawWords.map((w) => ({
      text: (w.word || '').trim(),
      start: w.start || 0,
      end: w.end || 0,
      confidence: 1,
      isEdited: false,
    }));

    return [{
      id: generateId(),
      words,
      text: (data.text as string) || '',
      start: words[0]?.start || 0,
      end: words[words.length - 1]?.end || 0,
      bookmarks: [],
      annotations: [],
    }];
  }

  // Absolute fallback: plain text
  return [{
    id: generateId(),
    words: [],
    text: (data.text as string) || '',
    start: 0,
    end: 0,
    bookmarks: [],
    annotations: [],
  }];
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
    'audio/aac': 'aac',
  };
  return map[mimeType] || 'webm';
}
