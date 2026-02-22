import type { TranscriptionMode } from '@/types';
import type { TranscriptionAnalysis } from '@/types/analysis';
import { TRANSCRIPTION_MODES, MODE_DETECT_PROMPT } from '@/config/transcriptionModes';
import { generateId } from '@/utils/idGenerator';

interface AnalyzeParams {
  transcript: string;
  mode: TranscriptionMode;
  apiKey: string;
}

export async function analyzeTranscript(params: AnalyzeParams): Promise<TranscriptionAnalysis> {
  const { transcript, mode, apiKey } = params;
  const modeConfig = TRANSCRIPTION_MODES[mode] || TRANSCRIPTION_MODES.general;

  const systemPrompt = `You are an expert transcript analyzer. ${modeConfig.systemPrompt}

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, just raw JSON.
The response must include these fields:
- "summary" (string)
- "keyTopics" (array of {topic, relevance, firstMentionAt, mentions})
- "sentiment" (object with {overall, score, bySpeaker})
- "actionItems" (array of {id, text, owner, deadline, priority, status})
- "decisions" (array of {id, text, madeBy, context})
- "followUps" (array of {id, text, assignedTo, dueDate, status})
${mode === 'meeting' ? '- "meetingMinutes" (object with title, date, attendees, agendaItems, discussionPoints, actionItems, decisions, nextSteps)' : ''}`;

  const truncated = transcript.length > 100000 ? transcript.slice(0, 100000) + '\n\n[Transcript truncated due to length]' : transcript;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Analyze this transcript and return the structured JSON analysis:\n\n${truncated}`,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message || `Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '{}';

  // Parse JSON from response (handle potential markdown code fences)
  let parsed;
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    parsed = {};
  }

  return {
    id: generateId(),
    transcriptionId: '',
    summary: parsed.summary || 'Analysis could not be generated.',
    keyTopics: (parsed.keyTopics || []).map((t: Record<string, unknown>) => ({
      topic: t.topic || '',
      relevance: Number(t.relevance) || 0,
      firstMentionAt: Number(t.firstMentionAt) || 0,
      mentions: Number(t.mentions) || 1,
    })),
    sentiment: {
      overall: parsed.sentiment?.overall || 'neutral',
      score: Number(parsed.sentiment?.score) || 0,
      bySpeaker: parsed.sentiment?.bySpeaker || {},
    },
    actionItems: (parsed.actionItems || []).map((a: Record<string, unknown>) => ({
      id: generateId(),
      text: a.text || '',
      owner: a.owner || undefined,
      deadline: a.deadline || undefined,
      priority: a.priority || 'medium',
      status: 'pending',
    })),
    decisions: (parsed.decisions || []).map((d: Record<string, unknown>) => ({
      id: generateId(),
      text: d.text || '',
      madeBy: d.madeBy || undefined,
      context: d.context || undefined,
    })),
    meetingMinutes: parsed.meetingMinutes || undefined,
    followUps: (parsed.followUps || []).map((f: Record<string, unknown>) => ({
      id: generateId(),
      text: f.text || '',
      assignedTo: f.assignedTo || undefined,
      dueDate: f.dueDate || undefined,
      status: 'open',
    })),
    customQueries: [],
    createdAt: Date.now(),
  };
}

export async function detectMode(
  transcript: string,
  apiKey: string
): Promise<{ mode: TranscriptionMode; confidence: number }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: MODE_DETECT_PROMPT + transcript,
      }],
    }),
  });

  if (!response.ok) {
    return { mode: 'general', confidence: 0 };
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  try {
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      mode: parsed.mode || 'general',
      confidence: Number(parsed.confidence) || 0,
    };
  } catch {
    return { mode: 'general', confidence: 0 };
  }
}

export async function generateTitle(
  transcript: string,
  mode: TranscriptionMode,
  apiKey: string
): Promise<string> {
  try {
    const snippet = transcript.slice(0, 2000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 60,
        messages: [{
          role: 'user',
          content: `Generate a short, descriptive title (3-7 words) for this ${mode} transcript. Return ONLY the title text, nothing else. No quotes, no punctuation at the end.\n\nTranscript:\n${snippet}`,
        }],
      }),
    });

    if (!response.ok) return '';
    const data = await response.json();
    const title = (data.content?.[0]?.text || '').trim().replace(/^["']|["']$/g, '').replace(/\.$/,'');
    return title.length > 0 && title.length < 80 ? title : '';
  } catch {
    return '';
  }
}

export async function customQuery(
  transcript: string,
  query: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: 'You are analyzing a transcript. Answer the user\'s question based on the transcript content. Be concise and specific.',
      messages: [{
        role: 'user',
        content: `Transcript:\n${transcript.slice(0, 80000)}\n\nQuestion: ${query}`,
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'Unable to process query.';
}
