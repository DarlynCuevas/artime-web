import Link from 'next/link';
import { AlertCircle, ArrowRight, Calendar, ClipboardList, Coins, Clock, CreditCard, LayoutDashboard } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useArtistDashboard } from '@/hooks/artists/useArtistDashboard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils';

function ArtistDashboardPage() {
  const { data, loading, error } = useArtistDashboard();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 animate-pulse">
          <Clock className="h-5 w-5" />
          <span className="text-sm font-medium">Cargando dashboard operativo...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto rounded-lg border border-red-100 bg-red-50 p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">No hay datos operativos disponibles en este momento.</p>
      </div>
    );
  }

  const { metrics, upcomingBookings } = data;
  const hasPending = metrics.pendingActionsCount > 0;

  return (
    <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <header className="border-b border-slate-100 pb-6 mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-900" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Artime OS</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Control operativo del artista</h1>
          <p className="text-sm text-slate-500 max-w-2xl">Gestión de bookings, ingresos y disponibilidad técnica en tiempo real.</p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard icon={<LayoutDashboard className="h-4 w-4" />} label="Bookings activos" value={metrics.activeBookingsCount} />
        <KpiCard icon={<Coins className="h-4 w-4" />} label="Ingresos previstos" value={formatCurrencySafe(metrics.expectedIncome)} />
        <KpiCard icon={<Coins className="h-4 w-4" />} label="Ingresos confirmados" value={formatCurrencySafe(metrics.confirmedIncome)} tone="emerald" />
        <KpiCard icon={<ClipboardList className="h-4 w-4" />} label="Ocupación mes" value={`${Math.round((metrics.occupancyRate ?? 0) * 100)}%`} />
        <KpiCard icon={<ClipboardList className="h-4 w-4" />} label="Días reservados" value={metrics.reservedDaysCount} />
        <KpiCard icon={<ClipboardList className="h-4 w-4" />} label="Ingreso total previsto" value={formatCurrencySafe(metrics.forecastIncome)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card title="Próximos shows" subtitle={`${upcomingBookings.length} fechas programadas`}>
            {upcomingBookings.length === 0 ? (
              <div className="py-12 text-center rounded-lg border border-dashed border-slate-200">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No hay shows próximos en la agenda.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                {upcomingBookings.map((booking, index) => (
                  <Link
                    key={booking.bookingId}
                    href={`/bookings/${booking.bookingId}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-all group"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-slate-900 truncate leading-none">{booking.venueName}</p>
                        <StatusBadge status={booking.status} className="scale-90 origin-left" />
                      </div>
                      <div className="flex items-center gap-4 text-[13px] text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(booking.startDate)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900 tabular-nums">{formatCurrency(booking.totalAmount, booking.currency)}</p>
                      <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Caché base</p>
                    </div>
                    <div className="ml-2 h-8 w-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Link
                href="/artists/bookings"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Acceder al histórico de bookings
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card
            title="Acciones pendientes"
            subtitle={hasPending ? 'Atención requerida' : 'Flujo operativo al día'}
            tone={hasPending ? 'amber' : 'slate'}
          >
            {hasPending ? (
              <div className="space-y-4">
                <PendingActionItem
                  title="Revisiones pendientes"
                  description="Responde a las propuestas activas y firma contratos para asegurar fechas."
                  dueDate={new Date().toISOString()}
                  urgent={metrics.pendingActionsCount > 2}
                />
                <Link
                  href="/tasks"
                  className="block w-full text-center py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Resolver ahora
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2 text-slate-500">
                <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <p className="text-sm">Todo está en orden.</p>
              </div>
            )}
          </Card>

          <Card title="Resumen financiero" subtitle="Ciclo actual" tone="slate">
            <div className="space-y-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
              <StatLine label="Bookings activos" value={metrics.activeBookingsCount} />
              <StatLine label="Shows este mes" value={metrics.upcomingBookingsCount} />
              <div className="h-px bg-slate-200 my-2" />
              <StatLine label="Volumen previsto" value={formatCurrencySafe(metrics.expectedIncome)} highlight />
              <StatLine label="Volumen confirmado" value={formatCurrencySafe(metrics.confirmedIncome)} highlight tone="emerald" />
              <div className="h-px bg-slate-200 my-2" />
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
  const accentClass = {
    slate: 'bg-slate-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
  }[tone];

  return (
    <div className="relative group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
      <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${accentClass}`} />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <div className="p-1.5 rounded-md bg-slate-50 text-slate-600">
            {icon}
          </div>
          <span>{label}</span>
        </div>
        <p className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children, tone = 'slate' }: { title: string; subtitle?: string; children: React.ReactNode; tone?: 'slate' | 'amber' }) {
  const headerBg = tone === 'amber' ? 'bg-amber-50/50' : 'bg-white';
  const borderClass = tone === 'amber' ? 'border-amber-200' : 'border-slate-200';

  return (
    <section className={`rounded-2xl ${borderClass} border bg-white shadow-sm overflow-hidden flex flex-col`}>
      <header className={`px-6 py-5 border-b border-slate-50 ${headerBg}`}>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-[12px] font-medium text-slate-400 mt-0.5">{subtitle}</p>}
      </header>
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}

function PendingActionItem({ title, description, dueDate, urgent }: { title: string; description: string; dueDate: string; urgent: boolean }) {
  const toneIcon = urgent ? 'text-amber-600' : 'text-slate-500';
  const toneBg = urgent ? 'bg-amber-50' : 'bg-slate-50';
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl ${toneBg} border border-transparent hover:border-slate-200 transition-all`}>
      <div className={`p-2 rounded-lg bg-white shadow-sm ${toneIcon}`}>
        <Clock className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-slate-900">{title}</p>
        <p className="text-[13px] text-slate-600 leading-snug mt-1">{description}</p>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50">
          <Calendar className="h-3 w-3 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Vence: {formatDate(dueDate)}</span>
        </div>
      </div>
    </div>
  );
}

function StatLine({ label, value, highlight = false, tone = 'slate' }: { label: string; value: string | number; highlight?: boolean; tone?: 'slate' | 'emerald' }) {
  const valueClass = highlight
    ? (tone === 'emerald' ? 'text-emerald-700 font-bold' : 'text-slate-900 font-bold')
    : 'text-slate-900 font-medium';

  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[13px] text-slate-500 font-medium">{label}</span>
      <span className={`text-[13px] tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return value;
  }
}

function formatCurrencySafe(amount?: number | null, currency: string = 'EUR') {
  if (amount === null || amount === undefined) return '—';
  return formatCurrency(amount, currency);
}
