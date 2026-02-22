import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { Card, Badge, EmptyState, Button, SearchInput } from '@/components/ui';
import { Mic, Upload, Clock, Star, FileText, Plus, Trash2 } from 'lucide-react';
import { formatRelativeTime, formatDuration } from '@/utils/formatters';
import { TRANSCRIPTION_MODES } from '@/config/transcriptionModes';
import { cn } from '@/utils/cn';
import type { Transcription } from '@/types';

export function DashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'starred'>('all');

  const transcriptions = useLiveQuery(
    () => db.transcriptions.orderBy('createdAt').reverse().toArray(),
    []
  );

  const tasks = useLiveQuery(
    () => db.tasks.where('status').notEqual('done').count(),
    []
  );

  const filtered = (transcriptions || []).filter((t) => {
    if (filter === 'starred' && !t.isStarred) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalDuration = (transcriptions || []).reduce((acc, t) => acc + (t.audioDuration || 0), 0);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Transcriptions"
          value={transcriptions?.length || 0}
          icon={<FileText className="w-5 h-5" />}
          color="text-primary-500"
        />
        <StatCard
          label="Total Duration"
          value={formatDuration(totalDuration)}
          icon={<Clock className="w-5 h-5" />}
          color="text-accent-500"
        />
        <StatCard
          label="Pending Tasks"
          value={tasks || 0}
          icon={<FileText className="w-5 h-5" />}
          color="text-warning-500"
        />
        <StatCard
          label="Starred"
          value={(transcriptions || []).filter((t) => t.isStarred).length}
          icon={<Star className="w-5 h-5" />}
          color="text-yellow-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button icon={<Mic className="w-4 h-4" />} onClick={() => navigate('/new')}>
          Record
        </Button>
        <Button variant="secondary" icon={<Upload className="w-4 h-4" />} onClick={() => navigate('/new')}>
          Upload Audio
        </Button>
      </div>

      {/* Transcription List */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-semibold flex-1">Recent Transcriptions</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
                filter === 'all' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >All</button>
            <button
              onClick={() => setFilter('starred')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
                filter === 'starred' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >Starred</button>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search transcriptions..." className="w-64" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Mic className="w-8 h-8" />}
            title={search ? 'No results found' : 'No transcriptions yet'}
            description={search ? 'Try a different search term' : 'Record or upload your first audio to get started'}
            action={!search ? <Button icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/new')}>Get Started</Button> : undefined}
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map((t) => (
              <TranscriptionRow key={t.id} transcription={t} onClick={() => navigate(`/transcription/${t.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={cn('p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800', color)}>{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
      </div>
    </Card>
  );
}

function TranscriptionRow({ transcription: t, onClick }: { transcription: Transcription; onClick: () => void }) {
  const mode = TRANSCRIPTION_MODES[t.mode] || TRANSCRIPTION_MODES.general;

  const handleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await db.transcriptions.update(t.id, { isStarred: !t.isStarred });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this transcription?')) {
      if (t.audioFileId) await db.audioFiles.delete(t.audioFileId).catch(() => {});
      if (t.analysisId) await db.analyses.delete(t.analysisId).catch(() => {});
      await db.transcriptions.delete(t.id);
    }
  };

  return (
    <Card hoverable onClick={onClick} className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${mode.color}20`, color: mode.color }}>
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{t.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge color={mode.color}>{mode.label}</Badge>
          <span className="text-xs text-[var(--text-muted)]">{formatDuration(t.audioDuration || 0)}</span>
          <span className="text-xs text-[var(--text-muted)]">{formatRelativeTime(t.createdAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={handleStar} className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 cursor-pointer">
          <Star className={cn('w-4 h-4', t.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--text-muted)]')} />
        </button>
        <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 cursor-pointer text-[var(--text-muted)] hover:text-danger-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
