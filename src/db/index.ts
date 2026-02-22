import Dexie, { type EntityTable } from 'dexie';
import type { Transcription } from '@/types/transcription';
import type { TranscriptionAnalysis } from '@/types/analysis';
import type { AudioFile } from '@/types/audio';
import type { Task } from '@/types/task';
import type { Project, Folder, Tag } from '@/types/project';

class VoiceTranscriptorDB extends Dexie {
  transcriptions!: EntityTable<Transcription, 'id'>;
  analyses!: EntityTable<TranscriptionAnalysis, 'id'>;
  audioFiles!: EntityTable<AudioFile, 'id'>;
  tasks!: EntityTable<Task, 'id'>;
  projects!: EntityTable<Project, 'id'>;
  folders!: EntityTable<Folder, 'id'>;
  tags!: EntityTable<Tag, 'id'>;

  constructor() {
    super('VoiceTranscriptorDB');

    this.version(1).stores({
      transcriptions: 'id, title, mode, status, language, projectId, folderId, createdAt, updatedAt, isStarred, *tags',
      analyses: 'id, transcriptionId, createdAt',
      audioFiles: 'id, name, createdAt',
      tasks: 'id, status, priority, transcriptionId, owner, dueDate, createdAt, sortOrder',
      projects: 'id, name, createdAt',
      folders: 'id, name, projectId, parentFolderId',
      tags: 'id, name',
    });
  }
}

export const db = new VoiceTranscriptorDB();
