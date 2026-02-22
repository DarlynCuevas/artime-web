import Link from 'next/link';
import { ArrowRight, Calendar, CreditCard, FileText, TrendingUp, Building2, Zap, Clock } from 'lucide-react';

import { useVenueDashboard } from '@/hooks/venues/useVenueDashboard';
import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';

type PendingActionType = 'payment' | 'response' | 'document';
type PendingAction = {
  id: string; title: string; description: string;
  type: PendingActionType; urgent: boolean;
};

function VenueDashboardPage() {
  const { data, loading } = useVenueDashboard();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-pulse">
            <Building2 className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando dashboard…</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-slate-700">No hay datos disponibles</div>;

  const { metrics, upcomingBookings } = data;
  const activeBookings = upcomingBookings;

  const pendingActions: PendingAction[] = metrics.pendingActionsCount > 0
    ? [{ id: 'pending', title: 'Acciones pendientes', description: `Tienes ${metrics.pendingActionsCount} acción${metrics.pendingActionsCount > 1 ? 'es' : ''} que requieren atención.`, type: 'response' as const, urgent: metrics.pendingActionsCount > 2 }]
    : [];
  const hasPending = pendingActions.length > 0;

  const kpis = [
    { label: 'Bookings activos', value: metrics.activeBookingsCount, icon: <Building2 className="w-4 h-4" />, accent: false },
    { label: 'Próximos bookings', value: metrics.upcomingBookingsCount, icon: <Calendar className="w-4 h-4" />, accent: false },
    { label: 'Gasto confirmado', value: formatCurrency(metrics.confirmedSpent, 'EUR'), icon: <CreditCard className="w-4 h-4" />, accent: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-fintech-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-0.5">Dashboard</p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Control del Venue</h1>
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
              {pendingActions.map((action) => (
                <PendingActionItem key={action.id} action={action} />
              ))}
              <Link href="/venues/bookings" className="mt-2 inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-amber-600 uppercase tracking-widest transition-colors">
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

        {/* Bookings activos */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">Bookings activos</h2>
                <p className="text-[10px] text-slate-400 font-bold">{activeBookings.length} contratación{activeBookings.length !== 1 ? 'es' : ''}</p>
              </div>
            </div>
          </div>

          {activeBookings.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">No hay bookings activos.</p>
              <Link href="/venues/bookings" className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest transition-colors">
                Ver todas las contrataciones <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {activeBookings.map((booking) => (
                <Link
                  key={booking.bookingId}
                  href={`/bookings/${booking.bookingId}`}
                  className="group flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                    <Building2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{booking.artistName}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400 font-medium">
                      {booking.startDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(booking.startDate)}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-900 tabular-nums">{formatCurrency(booking.totalAmount, booking.currency)}</p>
                    <p className="text-[10px] text-slate-400 font-bold">caché base</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-purple-300 group-hover:bg-purple-50 transition-all">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </Link>
              ))}
              <div className="px-6 py-4 bg-slate-50/30 flex justify-end">
                <Link href="/venues/bookings" className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-amber-600 uppercase tracking-widest transition-colors">
                  Ver todos los bookings <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default withRole(VenueDashboardPage, ['VENUE']);

// ── Sub-components ───────────────────────────────────────────
function PendingActionItem({ action }: { action: PendingAction }) {
  const iconMap = {
    payment: <CreditCard className={`w-4 h-4 ${action.urgent ? 'text-amber-600' : 'text-slate-500'}`} />,
    response: <Clock className={`w-4 h-4 ${action.urgent ? 'text-amber-600' : 'text-slate-500'}`} />,
    document: <FileText className={`w-4 h-4 ${action.urgent ? 'text-amber-600' : 'text-slate-500'}`} />,
  };
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${action.urgent ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50/50 border-slate-100'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${action.urgent ? 'bg-amber-500/10' : 'bg-slate-100'}`}>
        {iconMap[action.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-slate-900">{action.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{action.description}</p>
      </div>
      {action.urgent && (
        <span className="shrink-0 px-2 py-0.5 rounded-lg bg-amber-500 text-amber-950 text-[10px] font-black uppercase tracking-widest">Urgente</span>
      )}
    </div>
  );
}

// ── Utils ────────────────────────────────────────────────────
function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number, currency: string) {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}
