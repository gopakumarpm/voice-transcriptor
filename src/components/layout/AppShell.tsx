import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/ui';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/utils/cn';

export function AppShell() {
  const { sidebarCollapsed, toasts, dismissToast } = useUIStore();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'
        )}
      >
        <Header />

        <main className="p-4 sm:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
