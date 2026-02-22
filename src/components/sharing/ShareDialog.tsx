import { useState } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { shareTranscription } from '@/services/sharingService';
import { Share2, Mail, Copy, Check, CloudOff } from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transcriptionId: string;
  title: string;
}

export function ShareDialog({ isOpen, onClose, transcriptionId, title }: ShareDialogProps) {
  const { showToast } = useUIStore();
  const { isGuest } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isSupabaseConfigured() || isGuest) {
    return (
      <Modal open={isOpen} onClose={onClose} title="Share Transcription">
        <div className="flex flex-col items-center gap-4 py-6">
          <CloudOff className="w-12 h-12 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)] text-center">
            Sign in with an account to share transcriptions with others.
          </p>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  const handleShare = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await shareTranscription(transcriptionId, email.trim());
      showToast({ type: 'success', title: `Shared with ${email}` });
      setEmail('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sharing failed';
      showToast({ type: 'error', title: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/transcription/${transcriptionId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast({ type: 'success', title: 'Link copied!' });
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Share Transcription">
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Share "<span className="font-medium">{title}</span>" with others
        </p>

        {/* Share by email */}
        <div className="flex gap-2">
          <Input
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            className="flex-1"
          />
          <Button onClick={handleShare} loading={loading} disabled={!email.trim()}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-glass)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-[var(--bg-secondary)] text-[var(--text-muted)]">or</span>
          </div>
        </div>

        {/* Copy link */}
        <Button variant="outline" className="w-full" icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} onClick={handleCopyLink}>
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
      </div>
    </Modal>
  );
}
