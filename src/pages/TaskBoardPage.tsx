import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { Button, Modal, Input } from '@/components/ui';
import { useTaskStore } from '@/stores/useTaskStore';
import type { TaskStatus, TaskPriority, Task } from '@/types';
import { Plus, GripVertical, Clock, User, Trash2 } from 'lucide-react';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#94a3b8' },
  { id: 'in-progress', label: 'In Progress', color: '#6366f1' },
  { id: 'done', label: 'Done', color: '#10b981' },
];

export function TaskBoardPage() {
  const { tasks, loadTasks, addTask, moveTask, deleteTask } = useTaskStore();
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleAdd = async () => {
    if (!newTitle.trim() || !addingTo) return;
    await addTask({ title: newTitle, status: addingTo, priority: newPriority, tags: [] });
    setNewTitle('');
    setAddingTo(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedId) {
      moveTask(draggedId, status);
      setDraggedId(null);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[500px]">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="space-y-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                  <h3 className="font-semibold text-sm">{col.label}</h3>
                  <span className="text-xs text-[var(--text-muted)] bg-surface-200 dark:bg-surface-800 px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setAddingTo(col.id)}
                  className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-2 min-h-[100px]">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={() => setDraggedId(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    onMove={(status) => moveTask(task.id, status)}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div className="h-24 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-700 flex items-center justify-center text-sm text-[var(--text-muted)]">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <Modal open={addingTo !== null} onClose={() => setAddingTo(null)} title="Add Task">
        <div className="space-y-4">
          <Input
            label="Task Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter task..."
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setNewPriority(p)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm capitalize cursor-pointer transition-colors',
                    newPriority === p
                      ? p === 'high' ? 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400'
                        : p === 'medium' ? 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400'
                        : 'bg-surface-200 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
                      : 'bg-surface-100 dark:bg-surface-800/50 text-[var(--text-muted)]'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddingTo(null)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newTitle.trim()}>Add Task</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TaskCard({ task, onDragStart, onDelete, onMove }: {
  task: Task;
  onDragStart: () => void;
  onDelete: () => void;
  onMove: (status: TaskStatus) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="glass rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow group"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-[var(--text-muted)] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', task.status === 'done' && 'line-through text-[var(--text-muted)]')}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={cn(
              'w-2 h-2 rounded-full',
              task.priority === 'high' ? 'bg-danger-500' : task.priority === 'medium' ? 'bg-warning-500' : 'bg-surface-400'
            )} />
            <span className="text-xs text-[var(--text-muted)] capitalize">{task.priority}</span>
            {task.owner && (
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <User className="w-3 h-3" /> {task.owner}
              </span>
            )}
            {task.dueDate && (
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <Clock className="w-3 h-3" /> {task.dueDate}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-200 dark:hover:bg-surface-800 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Quick move buttons */}
      {task.status !== 'done' && (
        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status === 'todo' && (
            <button onClick={() => onMove('in-progress')} className="text-xs px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-600 cursor-pointer">
              Start
            </button>
          )}
          <button onClick={() => onMove('done')} className="text-xs px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-900/30 text-accent-600 cursor-pointer">
            Done
          </button>
        </div>
      )}
    </div>
  );
}
