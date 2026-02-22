import type { TranscriptionMode } from '@/types';
import type { AnalysisType } from '@/types/analysis';

export interface ModeConfig {
  label: string;
  icon: string;
  description: string;
  color: string;
  useDiarization: boolean;
  defaultAnalysisTypes: AnalysisType[];
  systemPrompt: string;
}

export const TRANSCRIPTION_MODES: Record<TranscriptionMode, ModeConfig> = {
  meeting: {
    label: 'Meeting',
    icon: 'Users',
    description: 'Meeting transcription with minutes, action items, and decisions',
    color: '#6366f1',
    useDiarization: true,
    defaultAnalysisTypes: ['summary', 'actionItems', 'decisions', 'meetingMinutes', 'followUps', 'sentiment'],
    systemPrompt: `You are analyzing a meeting transcript. Extract the following in JSON format:
{
  "summary": "2-3 paragraph summary of the meeting",
  "keyTopics": [{"topic": "", "relevance": 0.0-1.0, "firstMentionAt": 0, "mentions": 0}],
  "sentiment": {"overall": "positive|negative|neutral|mixed", "score": -1.0 to 1.0, "bySpeaker": {}},
  "actionItems": [{"id": "", "text": "", "owner": "", "deadline": "", "priority": "high|medium|low", "status": "pending"}],
  "decisions": [{"id": "", "text": "", "madeBy": "", "context": ""}],
  "meetingMinutes": {
    "title": "", "date": "", "attendees": [], "agendaItems": [],
    "discussionPoints": [{"topic": "", "discussion": "", "outcome": ""}],
    "actionItems": [], "decisions": [], "nextSteps": []
  },
  "followUps": [{"id": "", "text": "", "assignedTo": "", "dueDate": "", "status": "open"}]
}`,
  },
  interview: {
    label: 'Interview',
    icon: 'UserCheck',
    description: 'Interview with Q&A extraction and candidate evaluation',
    color: '#ec4899',
    useDiarization: true,
    defaultAnalysisTypes: ['summary', 'keyTopics', 'sentiment', 'actionItems'],
    systemPrompt: `You are analyzing an interview transcript. Extract Q&A pairs, evaluate candidate responses, identify key strengths and areas of concern. Return JSON with: summary, keyTopics, sentiment (per speaker), actionItems (follow-up items), and decisions.`,
  },
  lecture: {
    label: 'Lecture',
    icon: 'GraduationCap',
    description: 'Study notes, key concepts, and topic outline',
    color: '#10b981',
    useDiarization: false,
    defaultAnalysisTypes: ['summary', 'keyTopics'],
    systemPrompt: `You are analyzing a lecture/class transcript. Create comprehensive study notes with: summary (main concepts taught), keyTopics (concepts with relevance scores), organized outline of topics covered, key definitions, and important examples mentioned.`,
  },
  'phone-call': {
    label: 'Phone Call',
    icon: 'Phone',
    description: 'Call summary with follow-ups and commitments',
    color: '#3b82f6',
    useDiarization: true,
    defaultAnalysisTypes: ['summary', 'actionItems', 'followUps', 'sentiment'],
    systemPrompt: `You are analyzing a phone call transcript. Extract: summary of the call, action items and commitments made by each party, follow-up items with deadlines, sentiment analysis per speaker, and any decisions or agreements reached.`,
  },
  podcast: {
    label: 'Podcast',
    icon: 'Headphones',
    description: 'Chapters, highlights, key quotes, and topic index',
    color: '#8b5cf6',
    useDiarization: true,
    defaultAnalysisTypes: ['summary', 'keyTopics'],
    systemPrompt: `You are analyzing a podcast transcript. Create: summary, chapter breakdown with timestamps, key quotes worth highlighting, topic index, and main takeaways for listeners.`,
  },
  brainstorm: {
    label: 'Brainstorm',
    icon: 'Lightbulb',
    description: 'Ideas list, grouped themes, and priorities',
    color: '#f59e0b',
    useDiarization: true,
    defaultAnalysisTypes: ['summary', 'keyTopics', 'actionItems', 'decisions'],
    systemPrompt: `You are analyzing a brainstorming session transcript. Extract: all ideas mentioned (grouped by theme), action items to pursue, decisions on which ideas to move forward with, and a summary of the creative direction.`,
  },
  'voice-note': {
    label: 'Voice Note',
    icon: 'Mic',
    description: 'Quick notes, to-dos, and reminders',
    color: '#14b8a6',
    useDiarization: false,
    defaultAnalysisTypes: ['summary', 'actionItems'],
    systemPrompt: `You are analyzing a voice note/memo. Extract: organized notes from the stream of consciousness, any to-do items or tasks mentioned, reminders, and a clean summary.`,
  },
  legal: {
    label: 'Legal',
    icon: 'Scale',
    description: 'Verbatim transcript with legal annotations',
    color: '#64748b',
    useDiarization: true,
    defaultAnalysisTypes: ['summary', 'keyTopics', 'decisions'],
    systemPrompt: `You are analyzing a legal proceeding transcript. Provide: summary of proceedings, key legal points raised, objections and rulings, decisions made, and any exhibits or evidence referenced.`,
  },
  medical: {
    label: 'Medical',
    icon: 'Stethoscope',
    description: 'Patient notes, diagnosis, and prescriptions',
    color: '#ef4444',
    useDiarization: true,
    defaultAnalysisTypes: ['summary', 'actionItems', 'followUps'],
    systemPrompt: `You are analyzing a medical consultation transcript. Extract: patient complaint summary, symptoms discussed, diagnosis or differential diagnoses mentioned, prescribed treatments/medications, follow-up instructions, and any referrals made.`,
  },
  general: {
    label: 'General',
    icon: 'FileText',
    description: 'Plain transcript with basic summary',
    color: '#94a3b8',
    useDiarization: false,
    defaultAnalysisTypes: ['summary', 'keyTopics'],
    systemPrompt: `You are analyzing a general audio transcript. Provide: a clear summary, key topics discussed, and any notable points or action items if applicable.`,
  },
  'auto-detect': {
    label: 'Auto-Detect',
    icon: 'Sparkles',
    description: 'Let AI detect the conversation type',
    color: '#a855f7',
    useDiarization: true,
    defaultAnalysisTypes: ['summary', 'keyTopics', 'sentiment', 'actionItems'],
    systemPrompt: `First classify this transcript as one of: meeting, interview, lecture, phone-call, podcast, brainstorm, voice-note, legal, medical, or general. Then analyze accordingly.`,
  },
};

export const MODE_DETECT_PROMPT = `Analyze this transcript segment and classify it into exactly one category. Return JSON:
{"mode": "meeting|interview|lecture|phone-call|podcast|brainstorm|voice-note|legal|medical|general", "confidence": 0.0-1.0, "reason": "brief explanation"}

Transcript:
`;
