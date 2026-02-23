import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, UserRound } from 'lucide-react';

import { getManagerPublicProfile } from '@/services/managers/managers.service';
import { VerificationBanner } from '@/components/profile/VerificationBanner';

type ManagerPublicProfile = {
  id: string;
  name: string;
  createdAt?: string | null;
  isVerified?: boolean;
};

export default function ManagerPublicProfilePage() {
  const router = useRouter();
  const managerId = typeof router.query.id === 'string' ? router.query.id : '';
  const [profile, setProfile] = useState<ManagerPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!managerId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getManagerPublicProfile(managerId);
        setProfile(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [managerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <main className="p-8 max-w-3xl mx-auto">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error || 'Perfil no encontrado'}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="relative w-full overflow-hidden bg-fintech-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-10 space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>

          <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Perfil público · Manager</p>
              <h1 className="text-3xl font-black text-white tracking-tight">{profile.name}</h1>
              {profile.createdAt ? (
                <p className="text-sm text-white/70">En ARTIME desde {formatDate(profile.createdAt)}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/75 inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              Este manager representa artistas dentro del ecosistema ARTIME.
            </div>
          </section>

          {profile.isVerified ? (
            <div className="max-w-4xl">
              <VerificationBanner />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}
