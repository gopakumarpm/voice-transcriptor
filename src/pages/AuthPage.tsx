import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Mail, Lock, User, Chrome } from 'lucide-react';

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, continueAsGuest } = useAuthStore();
  const { showToast } = useUIStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured()) {
    // No Supabase — auto-continue as guest
    continueAsGuest();
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        showToast({ type: 'success', title: 'Welcome back!' });
      } else {
        await signUp(email, password, name);
        showToast({ type: 'success', title: 'Account created! Check your email to verify.' });
      }
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      showToast({ type: 'error', title: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      showToast({ type: 'error', title: msg });
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <img src="/logo.svg" alt="Voice Transcriptor" className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-lg shadow-primary-500/20" />
          <h1 className="text-2xl font-bold gradient-text">Voice Transcriptor</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">AI-powered transcription & analysis</p>
        </div>

        <Card>
          {/* Tabs */}
          <div className="flex mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                mode === 'signin'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                icon={<User className="w-4 h-4" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" loading={loading}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-glass)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[var(--bg-secondary)] text-[var(--text-muted)]">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full" icon={<Chrome className="w-4 h-4" />} onClick={handleGoogle}>
              Continue with Google
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleGuest}>
              Continue without account
            </Button>
          </div>
        </Card>

        <p className="text-center text-xs text-[var(--text-muted)]">
          Guest mode keeps all data locally. Sign in to enable cloud sync and collaboration.
        </p>
      </div>
    </div>
  );
}
