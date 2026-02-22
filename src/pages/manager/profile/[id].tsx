import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, ShieldCheck, UserRound } from 'lucide-react';

import { getManagerPublicProfile } from '@/services/managers/managers.service';

type ManagerPublicProfile = {
  id: string;
  name: string;
  createdAt?: string | null;
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
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
    <main className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <UserRound className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Perfil público · Manager</p>
          <h1 className="text-3xl font-semibold text-slate-900">{profile.name}</h1>
          {profile.createdAt ? (
            <p className="text-sm text-slate-500">En ARTIME desde {formatDate(profile.createdAt)}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          Este manager opera representando artistas dentro del ecosistema ARTIME.
        </div>
      </section>
    </main>
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

