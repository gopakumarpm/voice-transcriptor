import { useState } from 'react';
import { Button } from '@/components/ui';
import { useCollaborationStore } from '@/stores/useCollaborationStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { Send, MapPin } from 'lucide-react';

interface CommentInputProps {
  transcriptionId: string;
}

export function CommentInput({ transcriptionId }: CommentInputProps) {
  const [text, setText] = useState('');
  const [pinTimestamp, setPinTimestamp] = useState(false);
  const { addComment } = useCollaborationStore();
  const { currentTime } = usePlayerStore();

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await addComment(transcriptionId, text.trim(), pinTimestamp ? currentTime : undefined);
    setText('');
    setPinTimestamp(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          rows={1}
          className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-transparent px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
        />
        <button
          onClick={() => setPinTimestamp(!pinTimestamp)}
          title={pinTimestamp ? 'Unpin timestamp' : 'Pin to current timestamp'}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded cursor-pointer transition-colors ${
            pinTimestamp ? 'text-primary-500' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>
      <Button size="sm" onClick={handleSubmit} disabled={!text.trim()}>
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
