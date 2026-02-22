import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Calendar, Coins, Clock, HandCoins, Music2, Ticket, TrendingUp, Zap } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useArtistDashboard } from '@/hooks/artists/useArtistDashboard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';

function ArtistDashboardPage() {
  const { user } = useAuth();
  const { profileName } = useMe();
  const { data, loading, error } = useArtistDashboard();
  const { bookings, error: bookingsError } = useBookings(user?.token);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-pulse">
            <Music2 className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-8 text-red-600">{error ?? 'No hay datos disponibles'}</div>;
  }

  const { metrics, upcomingBookings } = data;
  const pendingActions = usePendingActions(bookings);
  const hasPending = pendingActions.length > 0;
  const firstName = profileName?.split(' ')[0] ?? 'Artista';

  const kpis = [
    { label: 'Bookings activos', value: metrics.activeBookingsCount, icon: <Ticket className="w-4 h-4" />, accent: false },
    { label: 'Próximos shows', value: metrics.upcomingBookingsCount, icon: <Calendar className="w-4 h-4" />, accent: false },
    { label: 'Ingresos confirmados', value: formatCurrencySafe(metrics.confirmedIncome), icon: <Coins className="w-4 h-4" />, accent: true },
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
                <Music2 className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-0.5">Dashboard</p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Hola, {firstName} <span className="wave">👋</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-16 sm:ml-0">
              {hasPending && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest animate-pulse">
                  <Zap className="w-3 h-3" /> {pendingActions.length} pendiente{pendingActions.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* KPI Pills */}
          <div className="grid grid-cols-3 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={`rounded-2xl px-4 py-3 border ${kpi.accent
                ? 'bg-amber-500/20 border-amber-400/30'
                : 'bg-white/5 border-white/10'
                }`}>
                <div className={`flex items-center gap-1.5 mb-1 ${kpi.accent ? 'text-amber-400' : 'text-white/40'}`}>
                  {kpi.icon}
                  <p className="text-[10px] font-bold uppercase tracking-widest">{kpi.label}</p>
                </div>
                <p className={`text-xl font-black tabular-nums ${kpi.accent ? 'text-amber-300' : 'text-white'}`}>
                  {kpi.value}
                </p>
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
              <Link
                href="/artists/bookings"
                className="mt-2 inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-amber-600 uppercase tracking-widest transition-colors"
              >
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

        {/* Próximos Shows */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">Próximos shows</h2>
                <p className="text-[10px] text-slate-400 font-bold">{upcomingBookings.length} fecha{upcomingBookings.length !== 1 ? 's' : ''} confirmada{upcomingBookings.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">No hay shows próximos programados.</p>
              <Link href="/artists/bookings" className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest transition-colors">
                Ver todas las contrataciones <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {upcomingBookings.map((booking) => (
                <Link
                  key={booking.bookingId}
                  href={`/bookings/${booking.bookingId}`}
                  className="group flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    <Music2 className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{booking.venueName}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(booking.startDate)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-900 tabular-nums">{formatCurrency(booking.totalAmount, booking.currency)}</p>
                    <p className="text-[10px] text-slate-400 font-bold">caché base</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-amber-300 group-hover:bg-amber-50 transition-all">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                </Link>
              ))}
              <div className="px-6 py-4 bg-slate-50/30 flex justify-end">
                <Link href="/artists/bookings" className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-amber-600 uppercase tracking-widest transition-colors">
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

export default withRole(ArtistDashboardPage, ['ARTIST']);

// ── Types ────────────────────────────────────────────────────
type BookingDto = {
  id: string; status: string; start_date: string | null;
  totalAmount: number | null; currency: string;
  venueId?: string | null; venueName?: string | null;
  city?: string | null; createdAt?: string | null;
  paidPercent?: number | null; eventName?: string | null;
};

const NEGOTIATION_STATUSES = ['NEGOTIATING', 'FINAL_OFFER_SENT'] as const;
const PAYMENT_PENDING_STATUSES = ['ACCEPTED', 'CONTRACT_SIGNED', 'PAID_PARTIAL', 'PAID_50', 'PAID_75', 'PAID_100', 'PAID_BALANCE'] as const;

// ── Hooks ────────────────────────────────────────────────────
function useBookings(userToken?: string) {
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userToken) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings`, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
      .then((res) => { if (!res.ok) throw new Error('Error cargando contrataciones'); return res.json(); })
      .then((data: any[]) => setBookings(data.map((b) => ({
        id: b.id, status: b.status,
        start_date: b.start_date ?? null, totalAmount: b.totalAmount ?? null,
        currency: b.currency ?? 'EUR', venueId: b.venueId ?? null,
        venueName: b.venueName ?? null, city: b.city ?? null,
        createdAt: b.createdAt ?? null, paidPercent: b.paidPercent ?? null,
        eventName: b.eventName ?? null,
      }))))
      .catch((err) => setError(err.message));
  }, [userToken]);

  return { bookings, error };
}

function usePendingActions(bookings: BookingDto[]) {
  return useMemo(() => {
    const actions: Array<{ key: string; title: string; description: string; count: number; urgent: boolean }> = [];
    const negotiating = bookings.filter((b) => NEGOTIATION_STATUSES.includes(b.status as any));
    const paymentPending = bookings.filter((b) => {
      const statusMatch = PAYMENT_PENDING_STATUSES.includes(b.status as any);
      const paidPercent = typeof b.paidPercent === 'number' ? b.paidPercent : null;
      return statusMatch && (paidPercent === null || paidPercent < 100);
    });
    if (negotiating.length > 0) actions.push({ key: 'negotiating', title: 'Negociaciones activas', description: `${negotiating.length} booking${negotiating.length > 1 ? 's' : ''} en negociación esperan tu respuesta.`, count: negotiating.length, urgent: negotiating.length >= 3 });
    if (paymentPending.length > 0) actions.push({ key: 'payments', title: 'Pagos pendientes', description: `${paymentPending.length} booking${paymentPending.length > 1 ? 's' : ''} tienen pagos por completar.`, count: paymentPending.length, urgent: paymentPending.length >= 2 });
    return actions;
  }, [bookings]);
}

// ── Sub-components ───────────────────────────────────────────
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

// ── Utils ────────────────────────────────────────────────────
function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrencySafe(amount?: number | null, currency: string = 'EUR') {
  if (amount === null || amount === undefined) return '—';
  return formatCurrency(amount, currency);
}
