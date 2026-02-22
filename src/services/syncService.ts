import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/db';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Transcription } from '@/types/transcription';
import type { TranscriptionAnalysis } from '@/types/analysis';
import type { Task } from '@/types/task';

// ─── Sync Queue (for offline operations) ───
interface SyncOperation {
  id: string;
  table: string;
  operation: 'upsert' | 'delete';
  data: Record<string, unknown>;
  createdAt: number;
}

let syncQueue: SyncOperation[] = [];
const QUEUE_KEY = 'vt-sync-queue';

function loadQueue(): void {
  try {
    const saved = localStorage.getItem(QUEUE_KEY);
    if (saved) syncQueue = JSON.parse(saved);
  } catch { /* ignore */ }
}

function saveQueue(): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(syncQueue));
}

function getUserId(): string | null {
  return useAuthStore.getState().user?.id || null;
}

function canSync(): boolean {
  return isSupabaseConfigured() && !useAuthStore.getState().isGuest && !!getUserId();
}

// ─── Upload Audio to Supabase Storage ───
export async function uploadAudio(blob: Blob, fileName: string): Promise<string | null> {
  if (!canSync()) return null;
  const userId = getUserId()!;
  const path = `${userId}/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from('audio-files')
    .upload(path, blob, { contentType: blob.type || 'audio/webm' });

  if (error) {
    console.warn('[VT Sync] Audio upload failed:', error.message);
    return null;
  }
  return path;
}

export async function getAudioUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from('audio-files')
    .createSignedUrl(path, 3600); // 1 hour
  return data?.signedUrl || null;
}

// ─── Sync Transcription ───
export async function syncTranscription(transcription: Transcription): Promise<void> {
  if (!canSync()) {
    queueOperation('transcriptions', 'upsert', transcription as unknown as Record<string, unknown>);
    return;
  }

  const userId = getUserId()!;
  const { error } = await supabase.from('transcriptions').upsert({
    id: transcription.id,
    user_id: userId,
    title: transcription.title,
    mode: transcription.mode,
    status: transcription.status,
    language: transcription.language,
    raw_text: transcription.rawText,
    segments: transcription.segments,
    detected_language: transcription.detectedLanguage || null,
    detected_mode: transcription.detectedMode || null,
    audio_file_url: transcription.audioFileUrl || null,
    audio_duration: transcription.audioDuration || 0,
    audio_file_name: transcription.audioFileName,
    analysis_id: transcription.analysisId || null,
    project_id: transcription.projectId || null,
    folder_id: transcription.folderId || null,
    tags: transcription.tags,
    is_starred: transcription.isStarred,
    created_at: transcription.createdAt,
    updated_at: transcription.updatedAt,
  });

  if (error) console.warn('[VT Sync] Transcription sync failed:', error.message);
}

// ─── Sync Analysis ───
export async function syncAnalysis(analysis: TranscriptionAnalysis): Promise<void> {
  if (!canSync()) {
    queueOperation('analyses', 'upsert', analysis as unknown as Record<string, unknown>);
    return;
  }

  const userId = getUserId()!;
  const { error } = await supabase.from('analyses').upsert({
    id: analysis.id,
    user_id: userId,
    transcription_id: analysis.transcriptionId,
    summary: analysis.summary,
    key_topics: analysis.keyTopics,
    sentiment: analysis.sentiment,
    action_items: analysis.actionItems,
    decisions: analysis.decisions,
    meeting_minutes: analysis.meetingMinutes || null,
    follow_ups: analysis.followUps,
    custom_queries: analysis.customQueries,
    created_at: analysis.createdAt,
  });

  if (error) console.warn('[VT Sync] Analysis sync failed:', error.message);
}

// ─── Sync Task ───
export async function syncTask(task: Task): Promise<void> {
  if (!canSync()) {
    queueOperation('tasks', 'upsert', task as unknown as Record<string, unknown>);
    return;
  }

  const userId = getUserId()!;
  const { error } = await supabase.from('tasks').upsert({
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description || null,
    status: task.status,
    priority: task.priority,
    owner: task.owner || null,
    due_date: task.dueDate || null,
    transcription_id: task.transcriptionId || null,
    linked_timestamp: task.linkedTimestamp || null,
    tags: task.tags,
    sort_order: task.sortOrder,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    completed_at: task.completedAt || null,
  });

  if (error) console.warn('[VT Sync] Task sync failed:', error.message);
}

export async function deleteFromCloud(table: string, id: string): Promise<void> {
  if (!canSync()) {
    queueOperation(table, 'delete', { id });
    return;
  }
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) console.warn(`[VT Sync] Delete from ${table} failed:`, error.message);
}

// ─── Pull from Cloud ───
export async function pullTranscriptions(): Promise<void> {
  if (!canSync()) return;

  const { data, error } = await supabase
    .from('transcriptions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error || !data) return;

  for (const row of data) {
    const existing = await db.transcriptions.get(row.id);
    // Only overwrite if cloud is newer
    if (!existing || row.updated_at > existing.updatedAt) {
      await db.transcriptions.put({
        id: row.id,
        title: row.title,
        mode: row.mode as Transcription['mode'],
        status: row.status as Transcription['status'],
        language: row.language || 'en',
        rawText: row.raw_text || '',
        segments: (row.segments || []) as Transcription['segments'],
        detectedLanguage: row.detected_language || undefined,
        detectedMode: row.detected_mode as Transcription['mode'] | undefined,
        audioFileId: '',
        audioDuration: row.audio_duration || 0,
        audioFileName: row.audio_file_name || '',
        analysisId: row.analysis_id || undefined,
        projectId: row.project_id || undefined,
        folderId: row.folder_id || undefined,
        tags: row.tags || [],
        isStarred: row.is_starred || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }
  }
}

// ─── Full Sync ───
export async function syncAll(): Promise<void> {
  if (!canSync()) return;
  loadQueue();
  await processSyncQueue();
  await pullTranscriptions();
}

// ─── Queue Management ───
function queueOperation(table: string, operation: 'upsert' | 'delete', data: Record<string, unknown>): void {
  const op: SyncOperation = {
    id: `${table}-${data.id}-${Date.now()}`,
    table,
    operation,
    data,
    createdAt: Date.now(),
  };
  syncQueue.push(op);
  saveQueue();
}

async function processSyncQueue(): Promise<void> {
  if (!canSync() || syncQueue.length === 0) return;

  const queue = [...syncQueue];
  syncQueue = [];
  saveQueue();

  for (const op of queue) {
    try {
      if (op.operation === 'delete') {
        await deleteFromCloud(op.table, op.data.id as string);
      } else {
        const userId = getUserId()!;
        await supabase.from(op.table).upsert({ ...op.data, user_id: userId });
      }
    } catch (err) {
      console.warn('[VT Sync] Queue processing failed for:', op, err);
      syncQueue.push(op); // Re-queue failed operations
    }
  }
  saveQueue();
}

// ─── Sync API Keys ───
export async function saveApiKeysToCloud(openaiKey: string, anthropicKey: string): Promise<void> {
  if (!canSync()) return;
  const userId = getUserId()!;

  const { error } = await supabase.from('profiles').update({
    openai_api_key: openaiKey,
    anthropic_api_key: anthropicKey,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  if (error) console.warn('[VT Sync] API key sync failed:', error.message);
}

export async function loadApiKeysFromCloud(): Promise<{ openaiApiKey: string; anthropicApiKey: string } | null> {
  if (!canSync()) return null;
  const userId = getUserId()!;

  const { data, error } = await supabase
    .from('profiles')
    .select('openai_api_key, anthropic_api_key')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    openaiApiKey: data.openai_api_key || '',
    anthropicApiKey: data.anthropic_api_key || '',
  };
}

// Process queue when coming online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[VT Sync] Back online, processing sync queue...');
    processSyncQueue();
  });
  loadQueue();
}
