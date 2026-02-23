import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, ShieldCheck, Loader2 } from 'lucide-react';

import { supabase } from '@/services/supabase/supabaseClient';
import { AuthShell } from '@/components/auth/AuthShell';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const token = data.session?.access_token;
    const nextQuery = typeof router.query.next === 'string' ? router.query.next : undefined;
    const safeNext = nextQuery && nextQuery.startsWith('/') ? nextQuery : undefined;

    if (!token) {
      router.push('/');
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) throw new Error('API base url no definida');
      const meRes = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) throw new Error('No se pudo resolver /me');
      const me = await meRes.json();

      if (me?.isAdmin) {
        router.push('/admin/verifications');
        return;
      }

      const profiles = me?.profiles ?? {};
      if (profiles.manager?.id) {
        router.push('/manager/dashboard');
        return;
      }
      if (profiles.venue?.id) {
        router.push('/venues');
        return;
      }
      if (profiles.artist?.id) {
        router.push('/artists/dashboard');
        return;
      }
      if (profiles.promoter?.id) {
        router.push('/promoter/dashboard');
        return;
      }

      if (safeNext && safeNext !== '/login') {
        router.push(safeNext);
        return;
      }
      router.push('/');
    } catch {
      // Fallback defensivo si /me falla: evitamos redirigir a rutas protegidas para no crear bucles.
      router.push('/');
    }
  };

  return (
    <AuthShell
      title="Acceso profesional"
      subtitle="Inicia sesión para gestionar bookings, contratos y pagos."
      eyebrow="Acceso"
      icon={<ShieldCheck className="h-6 w-6" />}
      backHref="/"
      footer={
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span>¿No tienes cuenta?</span>
          <Link href="/register" className="font-black uppercase tracking-widest text-slate-700 hover:text-amber-700 transition-colors">
            Crear cuenta
          </Link>
        </div>
      }
    >
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
          {error}
        </div>
      )}

      <form className="space-y-4 mt-4" onSubmit={handleLogin}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
            <Mail className="h-4 w-4 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm bg-transparent focus:outline-none"
              placeholder="tu@correo.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Contraseña</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
            <Lock className="h-4 w-4 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm bg-transparent focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  );
}
