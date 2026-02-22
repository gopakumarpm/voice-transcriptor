import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { generateId } from '@/utils/idGenerator';
import type { Comment } from '@/types/comment';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CollaborationState {
  comments: Comment[];
  activeChannel: RealtimeChannel | null;
  onlineUsers: string[];
  loading: boolean;

  loadComments: (transcriptionId: string) => Promise<void>;
  addComment: (transcriptionId: string, text: string, timestampRef?: number) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  subscribeToComments: (transcriptionId: string) => void;
  unsubscribe: () => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  comments: [],
  activeChannel: null,
  onlineUsers: [],
  loading: false,

  loadComments: async (transcriptionId) => {
    if (!isSupabaseConfigured()) return;
    set({ loading: true });

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('transcription_id', transcriptionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[VT Collab] Failed to load comments:', error.message);
      set({ loading: false });
      return;
    }

    const comments: Comment[] = (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      transcriptionId: row.transcription_id,
      text: row.text,
      timestampRef: row.timestamp_ref || undefined,
      parentId: row.parent_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    set({ comments, loading: false });
  },

  addComment: async (transcriptionId, text, timestampRef) => {
    if (!isSupabaseConfigured()) return;
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = Date.now();
    const comment: Comment = {
      id: generateId(),
      userId,
      transcriptionId,
      text,
      timestampRef,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update
    set((state) => ({ comments: [...state.comments, comment] }));

    const { error } = await supabase.from('comments').insert({
      id: comment.id,
      user_id: userId,
      transcription_id: transcriptionId,
      text,
      timestamp_ref: timestampRef || null,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      console.warn('[VT Collab] Failed to add comment:', error.message);
      // Rollback
      set((state) => ({ comments: state.comments.filter((c) => c.id !== comment.id) }));
    }
  },

  deleteComment: async (commentId) => {
    set((state) => ({ comments: state.comments.filter((c) => c.id !== commentId) }));
    await supabase.from('comments').delete().eq('id', commentId);
  },

  subscribeToComments: (transcriptionId) => {
    if (!isSupabaseConfigured()) return;

    // Unsubscribe from previous
    get().unsubscribe();

    const channel = supabase
      .channel(`comments:${transcriptionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `transcription_id=eq.${transcriptionId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const comment: Comment = {
            id: row.id as string,
            userId: row.user_id as string,
            transcriptionId: row.transcription_id as string,
            text: row.text as string,
            timestampRef: (row.timestamp_ref as number) || undefined,
            parentId: (row.parent_id as string) || undefined,
            createdAt: row.created_at as number,
            updatedAt: row.updated_at as number,
          };

          // Avoid duplicates (from our own optimistic update)
          set((state) => {
            if (state.comments.some((c) => c.id === comment.id)) return state;
            return { comments: [...state.comments, comment] };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `transcription_id=eq.${transcriptionId}`,
        },
        (payload) => {
          const id = (payload.old as Record<string, unknown>).id as string;
          set((state) => ({ comments: state.comments.filter((c) => c.id !== id) }));
        }
      )
      .subscribe();

    set({ activeChannel: channel });
  },

  unsubscribe: () => {
    const { activeChannel } = get();
    if (activeChannel) {
      supabase.removeChannel(activeChannel);
      set({ activeChannel: null, onlineUsers: [] });
    }
  },
}));
