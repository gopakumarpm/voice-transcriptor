import { create } from 'zustand';
import type { Theme } from '@/types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface UIState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeModal: string | null;
  toasts: Toast[];
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

const savedTheme = (localStorage.getItem('vt-theme') as Theme) || 'dark';
const initialResolved = getResolvedTheme(savedTheme);
applyTheme(initialResolved);

export const useUIStore = create<UIState>((set) => ({
  theme: savedTheme,
  resolvedTheme: initialResolved,
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModal: null,
  toasts: [],

  setTheme: (theme) => {
    const resolved = getResolvedTheme(theme);
    applyTheme(resolved);
    localStorage.setItem('vt-theme', theme);
    set({ theme, resolvedTheme: resolved });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),

  showToast: (toast) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
