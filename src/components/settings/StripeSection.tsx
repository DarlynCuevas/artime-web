import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import type { UserRole } from '@/types/user-role';
import { getStripeOnboardingStatus, startStripeOnboarding, type StripeOnboardingStatusResponse } from '@/services/payments/stripe-onboarding.service';

export function StripeSection({
  token,
  role,
  profileId,
}: {
  token: string;
  role: UserRole;
  profileId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StripeOnboardingStatusResponse | null>(null);

  const canConnectNow = Boolean(profileId);

  useEffect(() => {
    if (!profileId) {
      setStatus(null);
      return;
    }

    let mounted = true;
    const loadStatus = async () => {
      setLoadingStatus(true);
      setError(null);
      try {
        const data = await getStripeOnboardingStatus({ role, profileId, token });
        if (mounted) setStatus(data);
      } catch (err: unknown) {
        if (mounted) {
          setStatus(null);
          setError(err instanceof Error ? err.message : 'No se pudo cargar Stripe.');
        }
      } finally {
        if (mounted) setLoadingStatus(false);
      }
    };

    loadStatus();
    return () => {
      mounted = false;
    };
  }, [profileId, role, token]);

  const statusBadge = useMemo(() => {
    if (!status) return null;
    if (status.onboardingStatus === 'COMPLETED') {
      return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">Completado</span>;
    }
    if (status.onboardingStatus === 'PENDING') {
      return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-700">Pendiente</span>;
    }
    return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-600">No iniciado</span>;
  }, [status]);

  const handleConnect = async () => {
    if (!profileId) return;
    setError(null);
    setLoading(true);
    try {
      const data = await startStripeOnboarding({ role, profileId, token });
      window.location.href = data.onboardingUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar Stripe.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-slate-100 p-2">
              <CreditCard className="h-4 w-4 text-slate-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Stripe Connect
              </h3>
              <p className="text-sm text-slate-600">
                Conecta tu cuenta para poder recibir pagos y cobros dentro de ARTIME.
              </p>
            </div>
          </div>
          {loadingStatus ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : statusBadge}
        </div>
      </section>

      {!profileId && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Completa primero tu onboarding para activar Stripe.
        </section>
      )}

      {canConnectNow && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="mb-4 flex items-start gap-2 text-emerald-800">
            {status?.onboardingStatus === 'PENDING' ? <Clock3 className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
            <p className="text-sm">
              {status?.onboardingStatus === 'COMPLETED'
                ? 'Tu cuenta ya está conectada. Puedes volver a Stripe para revisar o actualizar datos.'
                : status?.onboardingStatus === 'PENDING'
                  ? 'Tienes el onboarding de Stripe pendiente. Continúa el proceso para activar cobros y payouts.'
                  : 'Puedes conectar Stripe ahora o volver más tarde. El proceso continúa en Stripe.'}
            </p>
          </div>

          {status?.stripeAccountId && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              Cuenta Stripe: <span className="font-semibold text-slate-900">{status.stripeAccountId}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={loading || loadingStatus}
            onClick={handleConnect}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            {loading
              ? 'Abriendo Stripe...'
              : status?.onboardingStatus === 'PENDING'
                ? 'Continuar Stripe'
                : status?.onboardingStatus === 'COMPLETED'
                  ? 'Gestionar Stripe'
                  : 'Conectar Stripe'}
          </button>
        </section>
      )}
    </div>
  );
}
