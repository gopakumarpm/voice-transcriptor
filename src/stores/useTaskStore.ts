import { create } from 'zustand';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { db } from '@/db';
import { generateId } from '@/utils/idGenerator';

interface TaskState {
  tasks: Task[];
  loading: boolean;

  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus) => Promise<void>;
  createFromActionItems: (items: Array<{ text: string; owner?: string; deadline?: string; priority: TaskPriority }>, transcriptionId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,

  loadTasks: async () => {
    set({ loading: true });
    const tasks = await db.tasks.orderBy('sortOrder').toArray();
    set({ tasks, loading: false });
  },

  addTask: async (taskData) => {
    const { tasks } = get();
    const task: Task = {
      ...taskData,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sortOrder: tasks.length,
    };
    await db.tasks.add(task);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (id, updates) => {
    await db.tasks.update(id, { ...updates, updatedAt: Date.now() });
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t)),
    }));
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  moveTask: async (id, status) => {
    const updates: Partial<Task> = { status, updatedAt: Date.now() };
    if (status === 'done') updates.completedAt = Date.now();
    await db.tasks.update(id, updates);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  createFromActionItems: async (items, transcriptionId) => {
    const { tasks } = get();
    let sortOrder = tasks.length;
    const newTasks: Task[] = items.map((item) => ({
      id: generateId(),
      title: item.text,
      status: 'todo' as TaskStatus,
      priority: item.priority,
      owner: item.owner,
      dueDate: item.deadline,
      transcriptionId,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sortOrder: sortOrder++,
    }));
    await db.tasks.bulkAdd(newTasks);
    set((s) => ({ tasks: [...s.tasks, ...newTasks] }));
  },
}));
