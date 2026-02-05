import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { resolveRepresentationRequest, type RepresentationResolveAction } from '@/services/representations/representations.service';

export default function RepresentationRequestLanding() {
  const router = useRouter();
  const { managerName, commission } = router.query as { managerName?: string; commission?: string };
  const { role } = useMe();
  const { user } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<RepresentationResolveAction | null>(null);

  const commissionText = useMemo(() => {
    if (!commission) return null;
    const num = Number(commission);
    if (Number.isNaN(num)) return null;
    return `${num}% de comisión`;
  }, [commission]);

  useEffect(() => {
    if (role && role !== 'ARTIST') {
      setError('Esta acción solo está disponible para artistas.');
    }
  }, [role]);

  const disabled = submitting !== null;

  const handleResolve = async (action: RepresentationResolveAction) => {
    if (!user?.token) return;
    const requestId = router.query.requestId as string | undefined;
    if (!requestId) {
      setError('No se encontró el id de la solicitud. Usa el enlace desde la notificación.');
      return;
    }
    setSubmitting(action);
    setError(null);
    try {
      await resolveRepresentationRequest({ requestId, action, token: user.token });
      router.replace(`/artists/representation-requests/${requestId}?result=${action}`);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo procesar la solicitud');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">← Volver</Link>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-xl font-semibold text-slate-900">Solicitud de representación</h1>
            <p className="text-sm text-slate-600">Accede desde la notificación para cargar la solicitud correcta.</p>
            {managerName && <p className="text-sm text-slate-700">Manager: <span className="font-semibold">{managerName}</span></p>}
            {commissionText && <p className="text-sm text-slate-700">Propuesta: {commissionText}</p>}
            <p className="text-xs text-slate-500">Si no ves los datos, vuelve a abrir desde la campana de notificaciones.</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={() => handleResolve('ACCEPT')}
            disabled={disabled}
          >
            {submitting === 'ACCEPT' && <Loader2 className="h-4 w-4 animate-spin" />}
            Aceptar representación
          </button>
          <button
            type="button"
            className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handleResolve('REJECT')}
            disabled={disabled}
          >
            {submitting === 'REJECT' && <Loader2 className="h-4 w-4 animate-spin" />}
            Rechazar
          </button>
        </div>
      </section>
    </main>
  );
}
