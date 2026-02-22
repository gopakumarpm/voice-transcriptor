import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Spinner } from '@/components/ui';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isGuest } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && !isGuest && isSupabaseConfigured()) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, isGuest, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Allow access if: authenticated user, guest mode, or Supabase not configured
  if (user || isGuest || !isSupabaseConfigured()) {
    return <>{children}</>;
  }

  return null;
}
