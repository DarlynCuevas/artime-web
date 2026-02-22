import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowRight, Loader2, Lock, Mail, ShieldPlus, Users2 } from 'lucide-react';

import { supabase } from '@/services/supabase/supabaseClient';
import { AuthShell } from '@/components/auth/AuthShell';

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

      const session = data.session ?? (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        setError('Revisa tu correo para confirmar la cuenta.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          displayName,
        }),
      });

      if (!res.ok) throw new Error('No se pudo completar el registro.');
      await router.push(`/onboarding/${role.toLowerCase()}?displayName=${encodeURIComponent(displayName)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Regístrate y completa el onboarding para operar en ARTIME."
      eyebrow="Registro"
      icon={<ShieldPlus className="h-6 w-6" />}
      backHref="/"
      footer={
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span>¿Ya tienes cuenta?</span>
          <Link href="/login" className="font-black uppercase tracking-widest text-slate-700 hover:text-amber-700 transition-colors">
            Iniciar sesión
          </Link>
        </div>
      }
    >
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5 mt-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
            <Mail className="h-4 w-4 text-slate-500" />
            <input
              type="email"
              className="w-full text-sm bg-transparent focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
              <Lock className="h-4 w-4 text-slate-500" />
              <input
                type="password"
                className="w-full text-sm bg-transparent focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Confirmar password</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
              <Lock className="h-4 w-4 text-slate-500" />
              <input
                type="password"
                className="w-full text-sm bg-transparent focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
            <Users2 className="h-4 w-4 text-slate-500" /> Rol
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(ROLE_LABELS) as Role[]).map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => setRole(key)}
                className={`rounded-2xl border px-4 py-4 text-left transition shadow-sm ${
                  role === key
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="font-black">{ROLE_LABELS[key].title}</div>
                <div className={`text-sm ${role === key ? 'text-white/80' : 'text-slate-500'}`}>
                  {ROLE_LABELS[key].subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Nombre publico inicial</label>
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Cómo te verán en ARTIME"
            required
          />
          {role ? <p className="text-xs text-slate-500">{ROLE_LABELS[role].subtitle}. Podras editarlo despues.</p> : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-amber px-6 text-xs font-black uppercase tracking-[0.2em] text-amber-950 shadow-[0_10px_30px_rgba(245,158,11,0.18)] hover:bg-amber-400 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Al crear una cuenta aceptas operar dentro de ARTIME: negociación, contrato y pagos centralizados.
        </p>
      </form>
    </AuthShell>
  );
}
