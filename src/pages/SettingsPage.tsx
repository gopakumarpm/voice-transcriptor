import { useState } from 'react';
import { Card, Button, Toggle, Tabs } from '@/components/ui';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Key, Palette, Mic, Database, Cloud, AlertTriangle, Trash2, Eye, EyeOff, Wand2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { db } from '@/db';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api');

  const tabs = [
    { id: 'api', label: 'API Keys', icon: <Key className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'transcription', label: 'Transcription', icon: <Mic className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'api' && <APIKeysSection />}
      {activeTab === 'appearance' && <AppearanceSection />}
      {activeTab === 'transcription' && <TranscriptionSection />}
      {activeTab === 'data' && <DataSection />}
    </div>
  );
}

function APIKeysSection() {
  const { openaiApiKey, anthropicApiKey, updateSettings } = useSettingsStore();
  const { showToast } = useUIStore();
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);

  const testOpenAI = async () => {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${openaiApiKey}` },
      });
      showToast({ type: res.ok ? 'success' : 'error', title: res.ok ? 'OpenAI key is valid!' : 'Invalid OpenAI key' });
    } catch {
      showToast({ type: 'error', title: 'Connection failed' });
    }
  };

  const testAnthropic = async () => {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] }),
      });
      showToast({ type: res.ok ? 'success' : 'error', title: res.ok ? 'Claude key is valid!' : 'Invalid Anthropic key' });
    } catch {
      showToast({ type: 'error', title: 'Connection failed' });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-warning-500/30 bg-warning-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-warning-600 dark:text-warning-400">API keys are stored in your browser</p>
            <p className="text-[var(--text-secondary)] mt-1">Keys are saved in localStorage and sent directly from your browser. This is suitable for personal use only.</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">OpenAI API Key</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-3">Required for transcription (Whisper API)</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showOpenAI ? 'text' : 'password'}
              value={openaiApiKey}
              onChange={(e) => updateSettings({ openaiApiKey: e.target.value.trim() })}
              placeholder="sk-..."
              className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-transparent px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
            <button onClick={() => setShowOpenAI(!showOpenAI)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--text-muted)]">
              {showOpenAI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button variant="outline" onClick={testOpenAI} disabled={!openaiApiKey}>Test</Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Anthropic API Key</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-3">Required for AI analysis (Claude API)</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showAnthropic ? 'text' : 'password'}
              value={anthropicApiKey}
              onChange={(e) => updateSettings({ anthropicApiKey: e.target.value.trim() })}
              placeholder="sk-ant-..."
              className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-transparent px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
            <button onClick={() => setShowAnthropic(!showAnthropic)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--text-muted)]">
              {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button variant="outline" onClick={testAnthropic} disabled={!anthropicApiKey}>Test</Button>
        </div>
      </Card>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme, resolvedTheme } = useUIStore();
  const { fontSize, updateSettings } = useSettingsStore();

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold mb-4">Theme</h3>
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'px-6 py-3 rounded-xl capitalize cursor-pointer transition-all',
                (theme || resolvedTheme) === t
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 border-2 border-primary-500'
                  : 'glass glass-hover border-2 border-transparent'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Font Size</h3>
        <div className="flex gap-3">
          {(['small', 'medium', 'large'] as const).map((s) => (
            <button
              key={s}
              onClick={() => updateSettings({ fontSize: s })}
              className={cn(
                'px-6 py-3 rounded-xl capitalize cursor-pointer transition-all',
                fontSize === s
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 border-2 border-primary-500'
                  : 'glass glass-hover border-2 border-transparent'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TranscriptionSection() {
  const { showTimestamps, showSpeakerLabels, showConfidence, enableAudioEnhancement, whisperModel, updateSettings } = useSettingsStore();

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold mb-4">Whisper Model</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-3">Choose the transcription model for accuracy vs speed</p>
        <div className="flex gap-3">
          {([
            { id: 'whisper-1', label: 'Whisper-1', desc: 'Fast & reliable' },
            { id: 'gpt-4o-transcribe', label: 'GPT-4o Transcribe', desc: 'Higher accuracy' },
          ] as const).map((m) => (
            <button
              key={m.id}
              onClick={() => updateSettings({ whisperModel: m.id })}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl text-left transition-all cursor-pointer',
                whisperModel === m.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 border-2 border-primary-500'
                  : 'glass glass-hover border-2 border-transparent'
              )}
            >
              <p className="font-medium text-sm">{m.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3 mb-4">
          <Wand2 className="w-5 h-5 text-accent-500 mt-0.5" />
          <div>
            <h3 className="font-semibold">Audio Enhancement</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Apply noise reduction, high-pass filter, and volume normalization before transcription</p>
          </div>
        </div>
        <Toggle checked={enableAudioEnhancement} onChange={(v) => updateSettings({ enableAudioEnhancement: v })} label="Enable audio enhancement" />
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Display Options</h3>
        <div className="space-y-4">
          <Toggle checked={showTimestamps} onChange={(v) => updateSettings({ showTimestamps: v })} label="Show timestamps" />
          <Toggle checked={showSpeakerLabels} onChange={(v) => updateSettings({ showSpeakerLabels: v })} label="Show speaker labels" />
          <Toggle checked={showConfidence} onChange={(v) => updateSettings({ showConfidence: v })} label="Show confidence indicators" />
        </div>
      </Card>
    </div>
  );
}

function DataSection() {
  const { showToast } = useUIStore();
  const { enableCloudSync, updateSettings } = useSettingsStore();
  const { isGuest, user } = useAuthStore();
  const supabaseReady = isSupabaseConfigured();

  const clearAll = async () => {
    if (!confirm('This will delete ALL transcriptions, tasks, and audio files. This cannot be undone.')) return;
    await Promise.all([
      db.transcriptions.clear(),
      db.analyses.clear(),
      db.audioFiles.clear(),
      db.tasks.clear(),
      db.projects.clear(),
      db.folders.clear(),
      db.tags.clear(),
    ]);
    showToast({ type: 'success', title: 'All data cleared' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <Cloud className="w-5 h-5 text-primary-500 mt-0.5" />
          <div>
            <h3 className="font-semibold">Cloud Sync</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {!supabaseReady
                ? 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
                : isGuest
                  ? 'Sign in with an account to enable cloud sync across devices.'
                  : `Syncing data for ${user?.email || 'your account'}`}
            </p>
          </div>
        </div>
        <Toggle
          checked={enableCloudSync && supabaseReady && !isGuest}
          onChange={(v) => updateSettings({ enableCloudSync: v })}
          label="Enable cloud sync"
          disabled={!supabaseReady || isGuest}
        />
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Data Management</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">All data is stored locally in your browser using IndexedDB.</p>
        <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={clearAll}>
          Clear All Data
        </Button>
      </Card>
    </div>
  );
}
