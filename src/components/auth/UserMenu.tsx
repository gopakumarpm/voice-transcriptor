import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { LogOut, Settings, User, Cloud, CloudOff } from 'lucide-react';

export function UserMenu() {
  const { user, profile, isGuest, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isSupabaseConfigured()) return null;

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'Guest';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-200/50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer"
      >
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
            {isGuest ? <User className="w-4 h-4" /> : initial}
          </div>
        )}
        {isGuest ? (
          <CloudOff className="w-3.5 h-3.5 text-warning-500" />
        ) : (
          <Cloud className="w-3.5 h-3.5 text-accent-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 glass border border-[var(--border-glass)] rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-3 border-b border-[var(--border-glass)]">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {isGuest ? 'Local mode — not synced' : user?.email}
            </p>
          </div>

          <div className="p-1">
            {isGuest ? (
              <button
                onClick={() => { setOpen(false); navigate('/auth'); }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-800/50 cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                Sign in to sync
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setOpen(false); navigate('/settings'); }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-800/50 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={async () => { setOpen(false); await signOut(); navigate('/auth'); }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-800/50 text-danger-500 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
