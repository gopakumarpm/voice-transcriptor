export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  owner?: string;
  dueDate?: string;
  transcriptionId?: string;
  linkedTimestamp?: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  sortOrder: number;
}
