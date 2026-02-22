import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { Card, Badge, EmptyState, SearchInput } from '@/components/ui';
import { TRANSCRIPTION_MODES } from '@/config/transcriptionModes';
import { formatDuration, formatRelativeTime } from '@/utils/formatters';
import { Search, FileText } from 'lucide-react';

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const transcriptions = useLiveQuery(
    () => db.transcriptions.orderBy('createdAt').reverse().toArray(),
    []
  );

  const results = useMemo(() => {
    if (!query.trim() || !transcriptions) return [];
    const q = query.toLowerCase();
    return transcriptions.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      t.rawText.toLowerCase().includes(q)
    ).map((t) => {
      // Find matching snippet
      const idx = t.rawText.toLowerCase().indexOf(q);
      const start = Math.max(0, idx - 60);
      const end = Math.min(t.rawText.length, idx + query.length + 60);
      const snippet = (start > 0 ? '...' : '') + t.rawText.slice(start, end) + (end < t.rawText.length ? '...' : '');
      return { ...t, snippet };
    });
  }, [query, transcriptions]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search across all transcriptions..."
        className="text-lg"
      />

      {query.trim() && (
        <p className="text-sm text-[var(--text-muted)]">{results.length} result{results.length !== 1 ? 's' : ''}</p>
      )}

      {query.trim() && results.length === 0 && (
        <EmptyState icon={<Search className="w-8 h-8" />} title="No results found" description="Try different keywords" />
      )}

      <div className="space-y-3">
        {results.map((r) => {
          const mode = TRANSCRIPTION_MODES[r.mode] || TRANSCRIPTION_MODES.general;
          return (
            <Card key={r.id} hoverable onClick={() => navigate(`/transcription/${r.id}`)}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${mode.color}20`, color: mode.color }}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge color={mode.color}>{mode.label}</Badge>
                    <span className="text-xs text-[var(--text-muted)]">{formatDuration(r.audioDuration)}</span>
                    <span className="text-xs text-[var(--text-muted)]">{formatRelativeTime(r.createdAt)}</span>
                  </div>
                  {r.snippet && (
                    <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">{r.snippet}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
