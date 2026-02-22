import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Calendar, ClipboardList, Coins, Clock, LayoutDashboard } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useArtistDashboard } from '@/hooks/artists/useArtistDashboard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/auth/useAuth';

function ArtistDashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useArtistDashboard();
  const { bookings, error: bookingsError } = useBookings(user?.token);

  if (loading) {
    return <div className="p-8 text-slate-700">Cargando dashboard…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  if (!data) {
    return <div className="p-8 text-slate-700">No hay datos disponibles</div>;
  }

  const { metrics, upcomingBookings } = data;
  const pendingActions = usePendingActions(bookings);
  const hasPending = pendingActions.length > 0;

  return (
    <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">Dashboard</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Control operativo del artista</h1>
        <p className="text-slate-600 max-w-2xl">Sin métricas de ego, solo lo que necesitas para actuar.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard icon={<LayoutDashboard className="h-4 w-4" />} label="Bookings activos" value={metrics.activeBookingsCount} />
        <KpiCard icon={<ClipboardList className="h-4 w-4" />} label="Próximos shows" value={metrics.upcomingBookingsCount} />
        <KpiCard icon={<Coins className="h-4 w-4" />} label="Volumen confirmado" value={formatCurrencySafe(metrics.confirmedIncome)} tone="emerald" />
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Acciones pendientes" subtitle={hasPending ? 'Requieren atención' : 'Sin pendientes'} tone={hasPending ? 'amber' : 'slate'}>
            {bookingsError && <p className="text-sm text-red-600">{bookingsError}</p>}
            {hasPending ? (
              <div className="space-y-4">
                {pendingActions.map((action) => (
                  <PendingActionItem
                    key={action.key}
                    title={action.title}
                    description={action.description}
                    count={action.count}
                    urgent={action.urgent}
                  />
                ))}
                <Link
                  href="/artists/bookings"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Ver contrataciones
                </Link>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No tienes acciones pendientes.</p>
            )}
          </Card>
        </div>
      </section>

      <section>
        <Card title="Próximos shows" subtitle={`${upcomingBookings.length} fechas`}>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-slate-500">No hay shows próximos.</p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
              {upcomingBookings.map((booking, index) => (
                <Link
                  key={booking.bookingId}
                  href={`/bookings/${booking.bookingId}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition group"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-slate-900 truncate">{booking.venueName}</p>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatDate(booking.startDate)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium text-slate-900">{formatCurrency(booking.totalAmount, booking.currency)}</p>
                    <p className="text-xs text-slate-500">caché base</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Link
              href="/artists/bookings"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Ver todos los bookings
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}

export default withRole(ArtistDashboardPage, ['ARTIST']);

type BookingDto = {
  id: string;
  status: string;
  start_date: string | null;
  totalAmount: number | null;
  currency: string;
  venueId?: string | null;
  venueName?: string | null;
  city?: string | null;
  createdAt?: string | null;
  paidPercent?: number | null;
  eventName?: string | null;
};

const NEGOTIATION_STATUSES = ['NEGOTIATING', 'FINAL_OFFER_SENT'] as const;
const PAYMENT_PENDING_STATUSES = [
  'ACCEPTED',
  'CONTRACT_SIGNED',
  'PAID_PARTIAL',
  'PAID_50',
  'PAID_75',
  'PAID_100',
  'PAID_BALANCE',
] as const;

function useBookings(userToken?: string) {
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userToken) return;

    setError(null);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudieron cargar las contrataciones');
        return res.json();
      })
      .then((data: any[]) => {
        const normalized = data.map((b) => ({
          id: b.id,
          status: b.status,
          start_date: b.start_date ?? null,
          totalAmount: b.totalAmount ?? null,
          currency: b.currency ?? 'EUR',
          venueId: b.venueId ?? null,
          venueName: b.venueName ?? null,
          city: b.city ?? null,
          createdAt: b.createdAt ?? null,
          paidPercent: b.paidPercent ?? null,
          eventName: b.eventName ?? null,
        })) as BookingDto[];
        setBookings(normalized);
      })
      .catch((err) => setError(err.message));
  }, [userToken]);

  return { bookings, error };
}

function usePendingActions(bookings: BookingDto[]) {
  return useMemo(() => {
    const negotiating = bookings.filter((b) => NEGOTIATION_STATUSES.includes(b.status as (typeof NEGOTIATION_STATUSES)[number]));
    const paymentPending = bookings.filter((b) => {
      const statusMatch = PAYMENT_PENDING_STATUSES.includes(b.status as (typeof PAYMENT_PENDING_STATUSES)[number]);
      const paidPercent = typeof b.paidPercent === 'number' ? b.paidPercent : null;
      return statusMatch && (paidPercent === null || paidPercent < 100);
    });

    const actions: Array<{
      key: string;
      title: string;
      description: string;
      count: number;
      urgent: boolean;
    }> = [];

    if (negotiating.length > 0) {
      actions.push({
        key: 'negotiating',
        title: 'Negociaciones activas',
        description: `Tienes ${negotiating.length} booking${negotiating.length > 1 ? 's' : ''} en negociación.`,
        count: negotiating.length,
        urgent: negotiating.length >= 3,
      });
    }

    if (paymentPending.length > 0) {
      actions.push({
        key: 'payments',
        title: 'Pagos pendientes',
        description: `Tienes ${paymentPending.length} booking${paymentPending.length > 1 ? 's' : ''} con pago pendiente.`,
        count: paymentPending.length,
        urgent: paymentPending.length >= 2,
      });
    }

    return actions;
  }, [bookings]);
}

function KpiCard({ icon, label, value, tone = 'slate' }: { icon: React.ReactNode; label: string; value: string | number; tone?: 'slate' | 'emerald' | 'amber' }) {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${toneClass}`}>{tone === 'emerald' ? 'Confirmado' : 'Operativo'}</span>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children, tone = 'slate' }: { title: string; subtitle?: string; children: React.ReactNode; tone?: 'slate' | 'amber' }) {
  const borderClass = tone === 'amber' ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-white';
  return (
    <section className={`rounded-2xl ${borderClass} shadow-sm p-6 space-y-4`}>
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function PendingActionItem({ title, description, count, urgent }: { title: string; description: string; count: number; urgent: boolean }) {
  const toneIcon = urgent ? 'text-amber-600' : 'text-slate-500';
  const toneBg = urgent ? 'bg-amber-100/70' : 'bg-slate-100';
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-xl ${toneBg}`}>
        <Clock className={`h-4 w-4 ${toneIcon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          <span>{count} pendiente{count > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrencySafe(amount?: number | null, currency: string = 'EUR') {
  if (amount === null || amount === undefined) return '—';
  return formatCurrency(amount, currency);
}
