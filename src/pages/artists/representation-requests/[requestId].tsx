import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { resolveRepresentationRequest, type RepresentationResolveAction } from '@/services/representations/representations.service';

export default function RepresentationRequestDetailPage() {
  const router = useRouter();
  const { requestId, managerName, commission } = router.query as { requestId?: string; managerName?: string; commission?: string };
  const { role } = useMe();
  const { user } = useAuth();

  const [submitting, setSubmitting] = useState<RepresentationResolveAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<'ACCEPTED' | 'REJECTED' | null>(null);

  const commissionText = useMemo(() => {
    if (!commission) return null;
    const num = Number(commission);
    if (Number.isNaN(num)) return null;
    return `${num}% de comisión`;
  }, [commission]);

  useEffect(() => {
    if (!requestId || role === undefined) return;
    if (role && role !== 'ARTIST') {
      setError('Esta acción solo está disponible para artistas.');
    }
  }, [requestId, role]);

  const handleResolve = async (action: RepresentationResolveAction) => {
    if (!requestId || !user?.token) return;
    setSubmitting(action);
    setError(null);
    try {
      await resolveRepresentationRequest({ requestId, action, token: user.token });
      setResolved(action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED');
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo procesar la solicitud');
    } finally {
      setSubmitting(null);
    }
  };

  const disabled = submitting !== null || resolved !== null;

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
            {requestId ? (
              <p className="text-sm text-slate-600">ID de solicitud: {requestId}</p>
            ) : (
              <p className="text-sm text-red-600">No se encontró el ID de la solicitud.</p>
            )}
            {managerName && <p className="text-sm text-slate-700">Manager: <span className="font-semibold">{managerName}</span></p>}
            {commissionText && <p className="text-sm text-slate-700">Propuesta: {commissionText}</p>}
            <p className="text-xs text-slate-500">Asegúrate de confiar en este manager antes de aceptar. Podrás terminar la relación más adelante desde tu perfil.</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {resolved && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {resolved === 'ACCEPTED' ? 'Has aceptado la representación.' : 'Has rechazado la representación.'}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={() => handleResolve('ACCEPT')}
            disabled={!requestId || disabled}
          >
            {submitting === 'ACCEPT' && <Loader2 className="h-4 w-4 animate-spin" />}
            Aceptar representación
          </button>
          <button
            type="button"
            className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handleResolve('REJECT')}
            disabled={!requestId || disabled}
          >
            {submitting === 'REJECT' && <Loader2 className="h-4 w-4 animate-spin" />}
            Rechazar
          </button>
        </div>

        {resolved === 'ACCEPTED' && (
          <p className="mt-3 text-xs text-slate-500">La relación de representación ya se ha activado en tu perfil.</p>
        )}
        {resolved === 'REJECTED' && (
          <p className="mt-3 text-xs text-slate-500">Si cambias de opinión, el manager deberá enviar una nueva solicitud.</p>
        )}
      </section>
    </main>
  );
}
