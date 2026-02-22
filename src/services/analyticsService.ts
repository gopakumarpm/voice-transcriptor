import { db } from '@/db';
import type { Transcription } from '@/types/transcription';

export interface AnalyticsData {
  totalTranscriptions: number;
  totalDuration: number;
  totalWords: number;
  avgDuration: number;
  transcriptionsByMode: { name: string; value: number }[];
  transcriptionsByLanguage: { name: string; value: number }[];
  transcriptionsOverTime: { date: string; count: number }[];
  durationOverTime: { date: string; duration: number }[];
  sentimentDistribution: { name: string; value: number }[];
  topTopics: { topic: string; count: number }[];
  taskStats: { todo: number; inProgress: number; done: number };
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const transcriptions = await db.transcriptions.toArray();
  const analyses = await db.analyses.toArray();
  const tasks = await db.tasks.toArray();

  const completed = transcriptions.filter((t) => t.status === 'completed');

  // Basic stats
  const totalDuration = completed.reduce((acc, t) => acc + (t.audioDuration || 0), 0);
  const totalWords = completed.reduce((acc, t) => acc + (t.rawText || '').split(/\s+/).filter(Boolean).length, 0);

  // By mode
  const modeMap: Record<string, number> = {};
  completed.forEach((t) => { modeMap[t.mode] = (modeMap[t.mode] || 0) + 1; });
  const transcriptionsByMode = Object.entries(modeMap).map(([name, value]) => ({ name, value }));

  // By language
  const langMap: Record<string, number> = {};
  completed.forEach((t) => {
    const lang = t.detectedLanguage || t.language || 'unknown';
    langMap[lang] = (langMap[lang] || 0) + 1;
  });
  const transcriptionsByLanguage = Object.entries(langMap).map(([name, value]) => ({ name, value }));

  // Over time (group by date)
  const dateMap: Record<string, { count: number; duration: number }> = {};
  completed.forEach((t) => {
    const date = new Date(t.createdAt).toISOString().split('T')[0];
    if (!dateMap[date]) dateMap[date] = { count: 0, duration: 0 };
    dateMap[date].count += 1;
    dateMap[date].duration += t.audioDuration || 0;
  });
  const sortedDates = Object.keys(dateMap).sort();
  const transcriptionsOverTime = sortedDates.map((date) => ({ date, count: dateMap[date].count }));
  const durationOverTime = sortedDates.map((date) => ({ date, duration: Math.round(dateMap[date].duration / 60) }));

  // Sentiment
  const sentimentMap: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
  analyses.forEach((a) => {
    const overall = a.sentiment?.overall?.toLowerCase() || 'neutral';
    if (overall in sentimentMap) sentimentMap[overall] += 1;
    else sentimentMap.neutral += 1;
  });
  const sentimentDistribution = Object.entries(sentimentMap)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  // Top topics
  const topicMap: Record<string, number> = {};
  analyses.forEach((a) => {
    (a.keyTopics || []).forEach((kt) => {
      topicMap[kt.topic] = (topicMap[kt.topic] || 0) + (kt.mentions || 1);
    });
  });
  const topTopics = Object.entries(topicMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count }));

  // Task stats
  const taskStats = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return {
    totalTranscriptions: completed.length,
    totalDuration,
    totalWords,
    avgDuration: completed.length > 0 ? totalDuration / completed.length : 0,
    transcriptionsByMode,
    transcriptionsByLanguage,
    transcriptionsOverTime,
    durationOverTime,
    sentimentDistribution,
    topTopics,
    taskStats,
  };
}

export function getWordFrequency(transcriptions: Transcription[], limit = 20): { word: string; count: number }[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'it', 'its', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him',
    'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their', 'not', 'so',
    'if', 'then', 'than', 'just', 'also', 'very', 'much', 'more', 'most',
    'um', 'uh', 'like', 'know', 'yeah', 'okay', 'oh', 'well', 'right',
  ]);

  const wordMap: Record<string, number> = {};
  transcriptions.forEach((t) => {
    const words = (t.rawText || '').toLowerCase().split(/\s+/);
    words.forEach((w) => {
      const clean = w.replace(/[^a-z'-]/g, '');
      if (clean.length > 2 && !stopWords.has(clean)) {
        wordMap[clean] = (wordMap[clean] || 0) + 1;
      }
    });
  });

  return Object.entries(wordMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}
