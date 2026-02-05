import Link from 'next/link';
import { AlertCircle, ArrowRight, Calendar, ClipboardList, Coins, Clock, CreditCard, LayoutDashboard } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useArtistDashboard } from '@/hooks/artists/useArtistDashboard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils';

function ArtistDashboardPage() {
  const { data, loading, error } = useArtistDashboard();

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
  const hasPending = metrics.pendingActionsCount > 0;

  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Control operativo del artista</h1>
        <p className="text-slate-600">Sin métricas de ego, solo lo que necesitas para actuar.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<LayoutDashboard className="h-4 w-4" />} label="Bookings activos" value={metrics.activeBookingsCount} />
        <KpiCard icon={<Coins className="h-4 w-4" />} label="Ingresos previstos" value={formatCurrencySafe(metrics.expectedIncome)} />
        <KpiCard icon={<Coins className="h-4 w-4" />} label="Ingresos confirmados" value={formatCurrencySafe(metrics.confirmedIncome)} tone="emerald" />
        <KpiCard icon={<ClipboardList className="h-4 w-4" />} label="Ocupación mes" value={`${Math.round((metrics.occupancyRate ?? 0) * 100)}%`} />
        <KpiCard icon={<ClipboardList className="h-4 w-4" />} label="Días reservados" value={metrics.reservedDaysCount} />
        <KpiCard icon={<ClipboardList className="h-4 w-4" />} label="Ingreso total previsto" value={formatCurrencySafe(metrics.forecastIncome)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
        </div>

        <div className="space-y-6">
          <Card title="Acciones pendientes" subtitle={hasPending ? 'Requieren atención' : 'Sin pendientes'} tone={hasPending ? 'amber' : 'slate'}>
            {hasPending ? (
              <PendingActionItem
                title="Revisa tus acciones"
                description="Responde propuestas, firma o sube documentos para avanzar."
                dueDate={new Date().toISOString()}
                urgent={metrics.pendingActionsCount > 2}
              />
            ) : (
              <p className="text-sm text-slate-500">No tienes acciones pendientes.</p>
            )}
          </Card>

          <Card title="Resumen rápido" subtitle="Este mes" tone="slate">
            <div className="space-y-3 text-sm text-slate-700">
              <StatLine label="Bookings activos" value={metrics.activeBookingsCount} />
              <StatLine label="Próximos shows" value={metrics.upcomingBookingsCount} />
              <StatLine label="Volumen previsto" value={formatCurrencySafe(metrics.expectedIncome)} />
              <StatLine label="Volumen confirmado" value={formatCurrencySafe(metrics.confirmedIncome)} />
              <StatLine label="Días bloqueados" value={metrics.blockedDaysCount} />
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

export default withRole(ArtistDashboardPage, ['ARTIST']);

function KpiCard({ icon, label, value, tone = 'slate' }: { icon: React.ReactNode; label: string; value: string | number; tone?: 'slate' | 'emerald' | 'amber' }) {
  const toneClass = {
    slate: 'bg-slate-900 text-white',
    emerald: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-white',
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`px-4 py-4 ${toneClass}`}>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children, tone = 'slate' }: { title: string; subtitle?: string; children: React.ReactNode; tone?: 'slate' | 'amber' }) {
  const borderClass = tone === 'amber' ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-white';
  return (
    <section className={`rounded-xl ${borderClass} shadow-sm p-5 space-y-4`}>
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

function PendingActionItem({ title, description, dueDate, urgent }: { title: string; description: string; dueDate: string; urgent: boolean }) {
  const toneIcon = urgent ? 'text-red-600' : 'text-slate-500';
  const toneBg = urgent ? 'bg-red-50' : 'bg-slate-100';
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${toneBg}`}>
        <Clock className={`h-4 w-4 ${toneIcon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          <span>Vence: {formatDate(dueDate)}</span>
        </div>
      </div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
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
