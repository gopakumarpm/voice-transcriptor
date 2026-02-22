import { useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/useUIStore';
import { UserMenu } from '@/components/auth/UserMenu';
import { Sun, Moon, Menu, ArrowLeft } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/new': 'New Transcription',
  '/tasks': 'Task Board',
  '/projects': 'Projects',
  '/analytics': 'Analytics',
  '/search': 'Search',
  '/settings': 'Settings',
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme, toggleSidebar } = useUIStore();

  const title = pageTitles[location.pathname] ||
    (location.pathname.startsWith('/transcription/') ? 'Transcription' : 'Voice Transcriptor');

  const showBack = location.pathname.startsWith('/transcription/');

  return (
    <header className="sticky top-0 z-30 h-16 glass border-b border-[var(--border-glass)] flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-surface-200/50 dark:hover:bg-surface-800/50 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-surface-200/50 dark:hover:bg-surface-800/50 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl hover:bg-surface-200/50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer"
          title="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
