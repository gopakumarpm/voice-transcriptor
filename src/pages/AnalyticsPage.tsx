import { useState, useEffect } from 'react';
import { Card, Spinner } from '@/components/ui';
import { getAnalytics, type AnalyticsData } from '@/services/analyticsService';
import { formatDuration } from '@/utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { FileText, Clock, Type, CheckCircle } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data || data.totalTranscriptions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <FileText className="w-12 h-12 text-[var(--text-muted)] mb-4" />
        <h2 className="text-lg font-semibold mb-2">No data yet</h2>
        <p className="text-sm text-[var(--text-muted)]">Create some transcriptions to see analytics</p>
      </div>
    );
  }

  const totalTasks = data.taskStats.todo + data.taskStats.inProgress + data.taskStats.done;
  const completionRate = totalTasks > 0 ? Math.round((data.taskStats.done / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileText className="w-5 h-5" />} color="text-primary-500" label="Transcriptions" value={data.totalTranscriptions} />
        <StatCard icon={<Clock className="w-5 h-5" />} color="text-accent-500" label="Total Duration" value={formatDuration(data.totalDuration)} />
        <StatCard icon={<Type className="w-5 h-5" />} color="text-warning-500" label="Total Words" value={data.totalWords.toLocaleString()} />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} color="text-emerald-500" label="Task Completion" value={`${completionRate}%`} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transcriptions Over Time */}
        <Card>
          <h3 className="font-semibold mb-4">Transcriptions Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.transcriptionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Duration Over Time */}
        <Card>
          <h3 className="font-semibold mb-4">Duration by Day (minutes)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.durationOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 12 }} />
                <Bar dataKey="duration" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mode Distribution */}
        <Card>
          <h3 className="font-semibold mb-4">Mode Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.transcriptionsByMode} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={(props: PieLabelRenderProps) => `${props.name || ''} ${(((props.percent as number) || 0) * 100).toFixed(0)}%`}>
                  {data.transcriptionsByMode.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sentiment */}
        <Card>
          <h3 className="font-semibold mb-4">Sentiment Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.sentimentDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={(props: PieLabelRenderProps) => `${props.name || ''} ${(((props.percent as number) || 0) * 100).toFixed(0)}%`}>
                  <Cell fill="#10b981" />
                  <Cell fill="#6b7280" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Topics */}
        <Card>
          <h3 className="font-semibold mb-4">Top Topics</h3>
          {data.topTopics.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No topics detected yet</p>
          ) : (
            <div className="space-y-2">
              {data.topTopics.slice(0, 6).map((t) => (
                <div key={t.topic} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{t.topic}</p>
                  </div>
                  <div className="w-24 h-2 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${Math.min(100, (t.count / (data.topTopics[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] w-8 text-right">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Language & Task Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Languages Used</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.transcriptionsByLanguage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={60} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 12 }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Task Overview</h3>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-warning-500">{data.taskStats.todo}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">To Do</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-500">{data.taskStats.inProgress}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent-500">{data.taskStats.done}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Done</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex gap-1 h-4 rounded-full overflow-hidden bg-surface-200 dark:bg-surface-800">
              {totalTasks > 0 && (
                <>
                  <div className="bg-warning-500" style={{ width: `${(data.taskStats.todo / totalTasks) * 100}%` }} />
                  <div className="bg-primary-500" style={{ width: `${(data.taskStats.inProgress / totalTasks) * 100}%` }} />
                  <div className="bg-accent-500" style={{ width: `${(data.taskStats.done / totalTasks) * 100}%` }} />
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string | number }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
      </div>
    </Card>
  );
}
