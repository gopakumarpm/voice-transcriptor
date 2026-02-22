import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import { DashboardPage } from '@/pages/DashboardPage';
import { NewTranscriptionPage } from '@/pages/NewTranscriptionPage';
import { TranscriptionDetailPage } from '@/pages/TranscriptionDetailPage';
import { TaskBoardPage } from '@/pages/TaskBoardPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { SearchPage } from '@/pages/SearchPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { AuthPage } from '@/pages/AuthPage';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={
          <AuthGuard>
            <AppShell />
          </AuthGuard>
        }>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/new" element={<NewTranscriptionPage />} />
          <Route path="/transcription/:id" element={<TranscriptionDetailPage />} />
          <Route path="/tasks" element={<TaskBoardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-64">
              <h1 className="text-4xl font-bold mb-2">404</h1>
              <p className="text-[var(--text-muted)]">Page not found</p>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
