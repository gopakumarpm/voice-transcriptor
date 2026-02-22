import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { cn } from '@/utils/cn';
import { Card, Button, Tabs, Badge, Spinner, Modal, EmptyState } from '@/components/ui';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useUIStore } from '@/stores/useUIStore';
import { customQuery } from '@/services/claude';
import { exportTranscription, type ExportFormat } from '@/services/exportService';
import { formatDuration, formatTimestamp } from '@/utils/formatters';
import { TRANSCRIPTION_MODES } from '@/config/transcriptionModes';
import { SPEAKER_COLORS, PLAYBACK_SPEEDS } from '@/config/constants';
import type { TranscriptionSegment } from '@/types';
import type { TranscriptionAnalysis } from '@/types/analysis';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Download, Star, MessageSquare, CheckSquare, FileText, BarChart3,
  ListTodo, Send, Copy, Clock
} from 'lucide-react';

export function TranscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const transcription = useLiveQuery(() => id ? db.transcriptions.get(id) : undefined, [id]);
  const analysis = useLiveQuery(
    () => transcription?.analysisId ? db.analyses.get(transcription.analysisId) : undefined,
    [transcription?.analysisId]
  );
  const audioFile = useLiveQuery(
    () => transcription?.audioFileId ? db.audioFiles.get(transcription.audioFileId) : undefined,
    [transcription?.audioFileId]
  );

  const [activeTab, setActiveTab] = useState('transcript');
  const [exportOpen, setExportOpen] = useState(false);

  if (!transcription) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  const mode = TRANSCRIPTION_MODES[transcription.detectedMode || transcription.mode] || TRANSCRIPTION_MODES.general;

  const handleStar = async () => {
    await db.transcriptions.update(transcription.id, { isStarred: !transcription.isStarred });
  };

  const handleExport = async (format: ExportFormat) => {
    await exportTranscription(transcription, analysis, format);
    setExportOpen(false);
  };

  const tabs = [
    { id: 'transcript', label: 'Transcript', icon: <FileText className="w-4 h-4" /> },
    { id: 'analysis', label: 'Analysis', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-4 h-4" />, count: analysis?.actionItems.length },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{transcription.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge color={mode.color}>{mode.label}</Badge>
            <span className="text-sm text-[var(--text-muted)]">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              {formatDuration(transcription.audioDuration)}
            </span>
            <span className="text-sm text-[var(--text-muted)]">{transcription.language.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleStar}>
            <Star className={cn('w-4 h-4', transcription.isStarred && 'fill-yellow-400 text-yellow-400')} />
          </Button>
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => setExportOpen(true)}>
            Export
          </Button>
        </div>
      </div>

      {/* Audio Player */}
      {audioFile && <AudioPlayer audioFile={audioFile} />}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div>
        {activeTab === 'transcript' && (
          <TranscriptPanel segments={transcription.segments} />
        )}
        {activeTab === 'analysis' && (
          <AnalysisPanel analysis={analysis} transcription={transcription} />
        )}
        {activeTab === 'tasks' && (
          <TasksPanel analysis={analysis} transcriptionId={transcription.id} />
        )}
      </div>

      {/* Export Modal */}
      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="Export Transcription">
        <div className="grid grid-cols-2 gap-3">
          {(['txt', 'pdf', 'docx', 'srt', 'vtt', 'json'] as ExportFormat[]).map((fmt) => (
            <Button key={fmt} variant="outline" onClick={() => handleExport(fmt)} className="justify-center">
              {fmt.toUpperCase()}
            </Button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// ─── Audio Player ──────────────────────────────────
function AudioPlayer({ audioFile }: { audioFile: { blob: Blob; duration: number } }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const { isPlaying, currentTime, speed, volume, isMuted, setPlaying, setCurrentTime, setDuration, setSpeed, setVolume, toggleMute } = usePlayerStore();

  useEffect(() => {
    const url = URL.createObjectURL(audioFile.blob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioFile.blob]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play(); }
    setPlaying(!isPlaying);
  };

  const seek = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
  };

  const handleSeekBar = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(parseFloat(e.target.value));
  };

  // Expose seekTo globally for transcript click-to-seek
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__vtSeekTo = seekTo;
    return () => { delete (window as unknown as Record<string, unknown>).__vtSeekTo; };
  }, []);

  return (
    <Card className="space-y-3">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
      />

      {/* Seek Bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-[var(--text-muted)] w-12 text-right">{formatDuration(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={audioFile.duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeekBar}
          className="flex-1 h-1.5 accent-primary-500 cursor-pointer"
        />
        <span className="text-xs font-mono text-[var(--text-muted)] w-12">{formatDuration(audioFile.duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => seek(-5)} className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 cursor-pointer">
            <SkipBack className="w-4 h-4" />
          </button>
          <button onClick={togglePlay} className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center shadow-lg cursor-pointer">
            {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
          </button>
          <button onClick={() => seek(5)} className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 cursor-pointer">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Speed */}
          <select
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value) as typeof speed)}
            className="bg-transparent text-sm font-medium px-2 py-1 rounded-lg border border-surface-300 dark:border-surface-700 cursor-pointer"
          >
            {PLAYBACK_SPEEDS.map((s) => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="p-1 cursor-pointer">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 accent-primary-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Transcript Panel ──────────────────────────────
function TranscriptPanel({ segments }: { segments: TranscriptionSegment[] }) {
  const { currentTime } = usePlayerStore();
  const transcriptRef = useRef<HTMLDivElement>(null);

  const handleWordClick = (time: number) => {
    const seekTo = (window as unknown as Record<string, (t: number) => void>).__vtSeekTo;
    if (seekTo) seekTo(time);
  };

  if (segments.length === 0) {
    return <EmptyState icon={<FileText className="w-8 h-8" />} title="No transcript available" />;
  }

  return (
    <div ref={transcriptRef} className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
      {segments.map((seg, segIdx) => {
        const isActive = currentTime >= seg.start && currentTime <= seg.end;
        const speakerColor = seg.speaker ? SPEAKER_COLORS[segIdx % SPEAKER_COLORS.length] : undefined;

        return (
          <div
            key={seg.id}
            className={cn(
              'p-4 rounded-xl transition-all duration-200',
              isActive ? 'glass border border-primary-500/30' : 'hover:bg-surface-100/50 dark:hover:bg-surface-800/50'
            )}
          >
            {/* Segment Header */}
            <div className="flex items-center gap-2 mb-2">
              {seg.speaker && (
                <Badge color={speakerColor}>{seg.speaker}</Badge>
              )}
              <button
                onClick={() => handleWordClick(seg.start)}
                className="text-xs text-[var(--text-muted)] hover:text-primary-500 font-mono cursor-pointer"
              >
                {formatTimestamp(seg.start)}
              </button>
            </div>

            {/* Words */}
            <p className="text-sm leading-relaxed">
              {seg.words.length > 0 ? (
                seg.words.map((word, wIdx) => {
                  const wordActive = currentTime >= word.start && currentTime <= word.end;
                  return (
                    <span
                      key={wIdx}
                      onClick={() => handleWordClick(word.start)}
                      className={cn(
                        'cursor-pointer hover:text-primary-500 transition-colors rounded px-0.5',
                        wordActive && 'bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300 font-medium'
                      )}
                    >
                      {word.text}{' '}
                    </span>
                  );
                })
              ) : (
                <span>{seg.text}</span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Analysis Panel ────────────────────────────────
function AnalysisPanel({ analysis, transcription }: { analysis?: TranscriptionAnalysis; transcription: { rawText: string } }) {
  const { anthropicApiKey } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState('');
  const [querying, setQuerying] = useState(false);

  const handleQuery = async () => {
    if (!query.trim() || !anthropicApiKey) return;
    setQuerying(true);
    try {
      const result = await customQuery(transcription.rawText, query, anthropicApiKey);
      setQueryResult(result);
    } catch {
      setQueryResult('Failed to process query.');
    }
    setQuerying(false);
  };

  if (!analysis) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-8 h-8" />}
        title="No analysis available"
        description="Add your Anthropic API key in Settings to enable AI analysis"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Summary</h3>
          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(analysis.summary)}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{analysis.summary}</p>
      </Card>

      {/* Key Topics */}
      {analysis.keyTopics.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-3">Key Topics</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.keyTopics.map((topic, i) => (
              <Badge key={i} color={SPEAKER_COLORS[i % SPEAKER_COLORS.length]}>
                {topic.topic} ({Math.round(topic.relevance * 100)}%)
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Sentiment */}
      <Card>
        <h3 className="font-semibold mb-3">Sentiment</h3>
        <div className="flex items-center gap-4">
          <Badge color={
            analysis.sentiment.overall === 'positive' ? '#10b981' :
            analysis.sentiment.overall === 'negative' ? '#ef4444' : '#94a3b8'
          }>
            {analysis.sentiment.overall}
          </Badge>
          <div className="flex-1 h-2 rounded-full bg-surface-200 dark:bg-surface-800 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                analysis.sentiment.score > 0 ? 'bg-accent-500' : analysis.sentiment.score < 0 ? 'bg-danger-500' : 'bg-surface-400'
              )}
              style={{ width: `${Math.abs(analysis.sentiment.score) * 50 + 50}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Decisions */}
      {analysis.decisions.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-3">Decisions</h3>
          <ul className="space-y-2">
            {analysis.decisions.map((d) => (
              <li key={d.id} className="flex items-start gap-2 text-sm">
                <CheckSquare className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{d.text}</p>
                  {d.madeBy && <p className="text-xs text-[var(--text-muted)]">by {d.madeBy}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Meeting Minutes */}
      {analysis.meetingMinutes && (
        <Card>
          <h3 className="font-semibold mb-3">Meeting Minutes</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1">Attendees</p>
              <p>{analysis.meetingMinutes.attendees.join(', ') || 'Not identified'}</p>
            </div>
            {analysis.meetingMinutes.discussionPoints.map((dp, i) => (
              <div key={i}>
                <p className="font-medium">{dp.topic}</p>
                <p className="text-[var(--text-secondary)]">{dp.discussion}</p>
                {dp.outcome && <p className="text-accent-600 dark:text-accent-400 mt-1">Outcome: {dp.outcome}</p>}
              </div>
            ))}
            {analysis.meetingMinutes.nextSteps.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1">Next Steps</p>
                <ul className="space-y-1">
                  {analysis.meetingMinutes.nextSteps.map((ns, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary-500">-</span> {ns}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Custom Query */}
      <Card>
        <h3 className="font-semibold mb-3">Ask about this transcript</h3>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="e.g. What was decided about the budget?"
            className="flex-1 rounded-xl border border-surface-300 dark:border-surface-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          <Button onClick={handleQuery} loading={querying} disabled={!query.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {queryResult && (
          <div className="mt-3 p-3 rounded-xl bg-surface-100 dark:bg-surface-800/50 text-sm whitespace-pre-wrap">
            {queryResult}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tasks Panel ───────────────────────────────────
function TasksPanel({ analysis, transcriptionId }: { analysis?: TranscriptionAnalysis; transcriptionId: string }) {
  const { tasks, loadTasks, createFromActionItems } = useTaskStore();
  const { showToast } = useUIStore();
  const [imported, setImported] = useState(false);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const relatedTasks = tasks.filter((t) => t.transcriptionId === transcriptionId);

  const handleImport = async () => {
    if (!analysis?.actionItems.length) return;
    await createFromActionItems(
      analysis.actionItems.map((a) => ({
        text: a.text,
        owner: a.owner,
        deadline: a.deadline,
        priority: a.priority,
      })),
      transcriptionId
    );
    setImported(true);
    showToast({ type: 'success', title: `${analysis.actionItems.length} tasks created` });
  };

  return (
    <div className="space-y-4">
      {/* Action Items from Analysis */}
      {analysis && analysis.actionItems.length > 0 && !imported && relatedTasks.length === 0 && (
        <Card className="border border-primary-500/20 bg-primary-50/50 dark:bg-primary-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{analysis.actionItems.length} action items detected</p>
              <p className="text-sm text-[var(--text-secondary)]">Import them as tasks to your board</p>
            </div>
            <Button size="sm" onClick={handleImport}>Import Tasks</Button>
          </div>
        </Card>
      )}

      {/* Task List */}
      {relatedTasks.length > 0 ? (
        <div className="space-y-2">
          {relatedTasks.map((task) => (
            <Card key={task.id} className="flex items-center gap-3">
              <div className={cn(
                'w-3 h-3 rounded-full',
                task.priority === 'high' ? 'bg-danger-500' : task.priority === 'medium' ? 'bg-warning-500' : 'bg-surface-400'
              )} />
              <div className="flex-1">
                <p className={cn('text-sm', task.status === 'done' && 'line-through text-[var(--text-muted)]')}>{task.title}</p>
                <div className="flex gap-2 mt-0.5">
                  {task.owner && <span className="text-xs text-[var(--text-muted)]">{task.owner}</span>}
                  <Badge>{task.status}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ListTodo className="w-8 h-8" />}
          title="No tasks yet"
          description={analysis?.actionItems.length ? 'Import action items from the analysis above' : 'Tasks will appear when analysis detects action items'}
        />
      )}
    </div>
  );
}
