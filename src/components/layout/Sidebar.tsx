import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import {
  LayoutDashboard, Plus, ListTodo, FolderOpen, Search, Settings,
  ChevronLeft, ChevronRight, BarChart3, X
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new', icon: Plus, label: 'New Transcription' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { sidebarOpen, sidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full glass border-r border-[var(--border-glass)] z-50 flex flex-col transition-all duration-300 w-[260px]',
          // Desktop: always visible, width controlled by collapse state
          sidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-[240px]',
          // Mobile: hidden off-screen by default, slide in when open
          // Desktop: always visible (lg:translate-x-0 overrides)
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[var(--border-glass)]">
          <img src="/logo.svg" alt="Voice Transcriptor" className="w-9 h-9 rounded-xl flex-shrink-0" />
          <span className={cn('font-bold text-lg gradient-text whitespace-nowrap flex-1', sidebarCollapsed && 'lg:hidden')}>
            Transcriptor
          </span>
          {/* Mobile close button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-800/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-[var(--text-secondary)] hover:bg-surface-200/50 dark:hover:bg-surface-800/50 hover:text-[var(--text-primary)]',
                  sidebarCollapsed && 'lg:justify-center lg:px-2'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn(sidebarCollapsed && 'lg:hidden')}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Toggle — desktop only */}
        <div className="p-3 border-t border-[var(--border-glass)] hidden lg:block">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center w-full py-2 rounded-xl text-[var(--text-muted)] hover:bg-surface-200/50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
}
