import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { Card, Button, EmptyState, Modal, Input } from '@/components/ui';
import { generateId } from '@/utils/idGenerator';
import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const PROJECT_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#ef4444'];

export function ProjectsPage() {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').reverse().toArray(), []);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await db.projects.add({
      id: generateId(),
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setName('');
    setDescription('');
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await db.projects.delete(id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>New Project</Button>
      </div>

      {!projects?.length ? (
        <EmptyState
          icon={<FolderOpen className="w-8 h-8" />}
          title="No projects yet"
          description="Create projects to organize your transcriptions"
          action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Create Project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Card key={p.id} hoverable className="group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${p.color}20`, color: p.color }}>
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{p.name}</p>
                  {p.description && <p className="text-sm text-[var(--text-muted)] mt-0.5">{p.description}</p>}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-surface-200 dark:hover:bg-surface-800 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Project">
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" autoFocus />
          <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Color</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn('w-8 h-8 rounded-full cursor-pointer transition-transform', color === c && 'ring-2 ring-offset-2 ring-primary-500 scale-110')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!name.trim()}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
