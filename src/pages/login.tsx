import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, Lock, Mail, ShieldCheck, Loader2 } from 'lucide-react';

import { supabase } from '@/services/supabase/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (typeof window === 'undefined') return;
    const referrer = document.referrer;
    const origin = window.location.origin;

    if (referrer && referrer.startsWith(origin)) {
      try {
        const url = new URL(referrer);
        if (url.pathname === '/') {
          router.push('/');
          return;
        }
      } catch {
        // Fallback to router.back()
      }
    }

    router.back();
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
          >
            ← Volver
          </button>
        </div>
        <header className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">Accede a Artime</h1>
          <p className="text-sm text-slate-600">Inicia sesión para gestionar tus eventos y bookings.</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Email</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm focus:outline-none"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Contraseña</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Lock className="h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
