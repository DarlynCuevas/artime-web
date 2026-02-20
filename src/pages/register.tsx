import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, CheckCircle2, Loader2, Lock, Mail, ShieldPlus, Users2 } from 'lucide-react';

import { supabase } from '@/services/supabase/supabaseClient';

type Role = 'ARTIST' | 'VENUE' | 'PROMOTER' | 'MANAGER';

const ROLE_LABELS: Record<Role, { title: string; subtitle: string }> = {
  ARTIST: { title: 'Artista', subtitle: 'Nombre artístico' },
  VENUE: { title: 'Sala', subtitle: 'Nombre de la sala' },
  PROMOTER: { title: 'Promotor', subtitle: 'Nombre profesional' },
  MANAGER: { title: 'Manager', subtitle: 'Nombre o agencia' },
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword || !role || !displayName) {
      setError('Completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      const session =
        data.session ?? (await supabase.auth.getSession()).data.session;

      if (!session?.access_token) {
        setError('Revisa tu correo para confirmar la cuenta.');
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/register`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role,
            displayName,
          }),
        },
      );

      if (!res.ok) {
        throw new Error('No se pudo completar el registro.');
      }

      await router.push(`/onboarding/${role.toLowerCase()}`);
    } catch (err: any) {
      setError(err?.message ?? 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-8">
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
            <ShieldPlus className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">Crear cuenta</h1>
          <p className="text-sm text-slate-600">Regístrate para iniciar tu onboarding en Artime.</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Email</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  className="w-full text-sm focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">Password</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    className="w-full text-sm focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">Confirmar password</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    className="w-full text-sm focus:outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-800 flex items-center gap-2"><Users2 className="h-4 w-4 text-slate-500" /> Rol</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(ROLE_LABELS) as Role[]).map((key) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setRole(key)}
                    className={`rounded-lg border px-4 py-3 text-left transition shadow-sm ${
                      role === key
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold">{ROLE_LABELS[key].title}</div>
                    <div className={`text-sm ${role === key ? 'text-white/80' : 'text-slate-500'}`}>
                      {ROLE_LABELS[key].subtitle}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">Nombre visible</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Cómo te verán en Artime"
                required
              />
              {role && (
                <p className="text-xs text-slate-500">{ROLE_LABELS[role].subtitle}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
