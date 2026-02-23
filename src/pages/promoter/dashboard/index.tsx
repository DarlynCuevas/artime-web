import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Calendar, CheckCircle2, Clock, FileSignature, TrendingUp, Users, Zap } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePromoterDashboard } from '@/hooks/promoter/usePromoterDashboard';
import { formatCurrency } from '@/lib/utils';

const PAYMENT_STATUSES = ['CONTRACT_SIGNED', 'PAID_PARTIAL'] as const;

type PromoterActionBooking = {
  id: string; artistName: string; eventName: string;
  date?: string | null; status: string; actionLabel?: string;
};

function PromoterDashboardPage() {
  const { data, loading, error } = usePromoterDashboard();
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');

  const filteredActiveEvents = useMemo(() => {
    if (!data?.events) return [];
    if (statusFilter === 'ALL') return data.events;
    return data.events.filter((e: any) => e.status === statusFilter);
  }, [data?.events, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-pulse">
            <Users className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !data) return <div className="p-8 text-red-600">{error ?? 'No hay datos disponibles'}</div>;

  const profile = data.profile ?? { name: 'Promotor', id: '—' };
  const metrics = data.metrics ?? {
    totalEvents: 0, activeEvents: 0, draftEvents: 0,
    confirmedEvents: 0, confirmedArtists: 0,
    pendingContractsCount: 0, pendingPaymentsCount: 0,
    pendingResponsesCount: 0, pendingActionsCount: 0,
  };
  const events = data.events ?? [];
  const actionBookings: PromoterActionBooking[] = data.actionBookings ?? [];

  const pendingActions = buildPendingActions(actionBookings, metrics);
  const hasPending = pendingActions.length > 0;

  const kpis = [
    { label: 'Eventos activos', value: metrics.activeEvents, icon: <TrendingUp className="w-4 h-4" />, accent: false },
    { label: 'Artistas confirmados', value: metrics.confirmedArtists ?? 0, icon: <CheckCircle2 className="w-4 h-4" />, accent: true },
    { label: 'Borradores', value: metrics.draftEvents, icon: <FileSignature className="w-4 h-4" />, accent: false },
  ];

  const statuses = Array.from(new Set(events.map((e: any) => e.status)));

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-fintech-dark rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-0.5">Dashboard</p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {profile.name}
                </h1>
              </div>
            </div>
            {hasPending && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest animate-pulse ml-16 sm:ml-0">
                <Zap className="w-3 h-3" /> {pendingActions.length} pendiente{pendingActions.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={`rounded-2xl px-4 py-3 border ${kpi.accent ? 'bg-amber-500/20 border-amber-400/30' : 'bg-white/5 border-white/10'}`}>
                <div className={`flex items-center gap-1.5 mb-1 ${kpi.accent ? 'text-amber-400' : 'text-white/40'}`}>
                  {kpi.icon}
                  <p className="text-[10px] font-bold uppercase tracking-widest">{kpi.label}</p>
                </div>
                <p className={`text-xl font-black tabular-nums ${kpi.accent ? 'text-amber-300' : 'text-white'}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">

        {/* Acciones Pendientes */}
        {hasPending ? (
          <div className="bg-white border border-amber-100 rounded-3xl shadow-[0_20px_50px_rgba(245,158,11,0.06)] overflow-hidden">
            <div className="px-6 py-5 border-b border-amber-50 bg-amber-50/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">Acciones pendientes</h2>
                <p className="text-[10px] text-amber-600 font-bold">Requieren tu atención</p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {pendingActions.map(({ key, ...rest }) => (
                <PendingActionItem key={key} {...rest} />
              ))}
              <Link href="/promoter/bookings" className="mt-2 inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-amber-600 uppercase tracking-widest transition-colors">
                Ver todas las contrataciones <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">Todo al día</p>
              <p className="text-xs text-slate-500">No tienes acciones pendientes. ¡Buen trabajo!</p>
            </div>
          </div>
        )}

        {/* Eventos */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">Eventos activos y próximos</h2>
                <p className="text-[10px] text-slate-400 font-bold">{events.length} evento{events.length !== 1 ? 's' : ''} en total</p>
              </div>
            </div>
            {/* Filtros */}
            <div className="flex items-center gap-2 ml-11 sm:ml-0 flex-wrap">
              <FilterChip label="Todos" active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} />
              {statuses.map((status: any) => (
                <FilterChip key={status} label={status} active={statusFilter === status} onClick={() => setStatusFilter(status)} />
              ))}
            </div>
          </div>

          {filteredActiveEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">No tienes eventos en este filtro.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredActiveEvents.map((event: any) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <Calendar className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{event.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400 font-medium">
                      {event.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(event.start_date)}</span>}
                    </div>
                  </div>
                  <StatusBadge status={event.status} />
                  <div className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-blue-300 group-hover:bg-blue-50 transition-all">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              ))}
              <div className="px-6 py-4 bg-slate-50/30 flex justify-end">
                <Link href="/promoter/events" className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-amber-600 uppercase tracking-widest transition-colors">
                  Ver todos los eventos <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default withRole(PromoterDashboardPage, ['PROMOTER']);

// ── Sub-components & Utils ───────────────────────────────────
function buildPendingActions(actionBookings: PromoterActionBooking[], metrics: any) {
  const negotiationCount = actionBookings.filter((b) => ['NEGOTIATING', 'FINAL_OFFER_SENT'].includes(b.status)).length;
  const paymentCount = actionBookings.filter((b) => PAYMENT_STATUSES.includes(b.status as any)).length;
  const responseCount = actionBookings.filter((b) => b.status === 'PENDING').length;

  return [
    negotiationCount > 0 ? { key: 'negotiations', title: 'Negociaciones activas', description: `${negotiationCount} booking${negotiationCount > 1 ? 's' : ''} en negociación.`, count: negotiationCount, urgent: negotiationCount >= 3 } : null,
    paymentCount > 0 ? { key: 'payments', title: 'Pagos pendientes', description: `${paymentCount} booking${paymentCount > 1 ? 's' : ''} con pago pendiente.`, count: paymentCount, urgent: paymentCount >= 2 } : null,
    responseCount > 0 ? { key: 'responses', title: 'Respuestas pendientes', description: `${responseCount} booking${responseCount > 1 ? 's' : ''} esperando respuesta.`, count: responseCount, urgent: responseCount >= 3 } : null,
    metrics.pendingContractsCount > 0 ? { key: 'contracts', title: 'Contratos por firmar', description: `${metrics.pendingContractsCount} contrato${metrics.pendingContractsCount > 1 ? 's' : ''} pendiente${metrics.pendingContractsCount > 1 ? 's' : ''} de firma.`, count: metrics.pendingContractsCount, urgent: metrics.pendingContractsCount >= 2 } : null,
  ].filter(Boolean) as Array<{ key: string; title: string; description: string; count: number; urgent: boolean }>;
}

function PendingActionItem({ title, description, count, urgent }: { title: string; description: string; count: number; urgent: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${urgent ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50/50 border-slate-100'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${urgent ? 'bg-amber-500/10' : 'bg-slate-100'}`}>
        <Clock className={`w-4 h-4 ${urgent ? 'text-amber-600' : 'text-slate-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${urgent ? 'bg-amber-500 text-amber-950' : 'bg-slate-200 text-slate-700'}`}>
        {count}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${active ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
    >
      {label}
    </button>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
