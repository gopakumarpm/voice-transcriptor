import { useEffect } from 'react';
import { useCollaborationStore } from '@/stores/useCollaborationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { CommentInput } from './CommentInput';
import { formatRelativeTime } from '@/utils/formatters';
import { MessageCircle, Trash2, Clock, CloudOff } from 'lucide-react';
import { Spinner } from '@/components/ui';

interface CommentThreadProps {
  transcriptionId: string;
  onTimestampClick?: (time: number) => void;
}

export function CommentThread({ transcriptionId, onTimestampClick }: CommentThreadProps) {
  const { comments, loading, loadComments, deleteComment, subscribeToComments, unsubscribe } = useCollaborationStore();
  const { user, isGuest } = useAuthStore();

  useEffect(() => {
    loadComments(transcriptionId);
    subscribeToComments(transcriptionId);
    return () => unsubscribe();
  }, [transcriptionId, loadComments, subscribeToComments, unsubscribe]);

  if (!isSupabaseConfigured() || isGuest) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CloudOff className="w-8 h-8 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)]">Sign in to use comments</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CommentInput transcriptionId={transcriptionId} />

      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <MessageCircle className="w-8 h-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No comments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="group flex gap-3 p-3 rounded-xl hover:bg-surface-100/50 dark:hover:bg-surface-800/30 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-600">
                  {(comment.userName || comment.userId.slice(0, 2)).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.userName || 'User'}</span>
                  <span className="text-xs text-[var(--text-muted)]">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="text-sm mt-0.5">{comment.text}</p>
                {comment.timestampRef !== undefined && (
                  <button
                    onClick={() => onTimestampClick?.(comment.timestampRef!)}
                    className="flex items-center gap-1 mt-1 text-xs text-primary-500 hover:text-primary-600 cursor-pointer"
                  >
                    <Clock className="w-3 h-3" />
                    {formatTimestampShort(comment.timestampRef)}
                  </button>
                )}
              </div>
              {comment.userId === user?.id && (
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger-100 dark:hover:bg-danger-900/20 text-[var(--text-muted)] hover:text-danger-500 cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimestampShort(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
