export type SentimentLabel = 'positive' | 'negative' | 'neutral' | 'mixed';

export type AnalysisType =
  | 'summary'
  | 'keyTopics'
  | 'sentiment'
  | 'actionItems'
  | 'decisions'
  | 'meetingMinutes'
  | 'followUps';

export interface KeyTopic {
  topic: string;
  relevance: number;
  firstMentionAt: number;
  mentions: number;
}

export interface SentimentResult {
  overall: SentimentLabel;
  score: number;
  bySpeaker: Record<string, { label: SentimentLabel; score: number }>;
}

export interface ActionItem {
  id: string;
  text: string;
  owner?: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  timestamp?: number;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Decision {
  id: string;
  text: string;
  madeBy?: string;
  timestamp?: number;
  context?: string;
}

export interface MeetingMinutes {
  title: string;
  date: string;
  attendees: string[];
  agendaItems: string[];
  discussionPoints: Array<{
    topic: string;
    discussion: string;
    outcome?: string;
  }>;
  actionItems: ActionItem[];
  decisions: Decision[];
  nextSteps: string[];
}

export interface FollowUp {
  id: string;
  text: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'open' | 'completed';
  linkedTimestamp?: number;
}

export interface CustomQueryResult {
  id: string;
  query: string;
  response: string;
  createdAt: number;
}

export interface TranscriptionAnalysis {
  id: string;
  transcriptionId: string;
  summary: string;
  keyTopics: KeyTopic[];
  sentiment: SentimentResult;
  actionItems: ActionItem[];
  decisions: Decision[];
  meetingMinutes?: MeetingMinutes;
  followUps: FollowUp[];
  customQueries: CustomQueryResult[];
  createdAt: number;
}
