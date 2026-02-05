import Link from 'next/link';
import { AlertCircle, ArrowRight, Calendar, ClipboardList, Coins, Clock, LayoutDashboard } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useArtistDashboard } from '@/hooks/artists/useArtistDashboard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils';

function ArtistDashboardPage() {
  const { data, loading, error } = useArtistDashboard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Artime OS • Artist Control</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-4 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <p className="font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No hay datos operativos disponibles.</p>
        </div>
      </div>
    );
  }

  const { metrics, upcomingBookings } = data;
  const hasPending = metrics.pendingActionsCount > 0;

  return (
    <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-12 bg-white min-h-screen">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-slate-900" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Artime OS • Artist Control</p>
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Control Operativo</h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl">Gestión de bookings, ingresos y agenda profesional en tiempo real.</p>
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
        <div className="lg:col-span-8 space-y-8">
          <Card title="Próximos shows" subtitle={`${upcomingBookings.length} fechas en calendario`}>
            {upcomingBookings.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sin shows próximos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <Link
                    key={booking.bookingId}
                    href={`/bookings/${booking.bookingId}`}
                    className="flex items-center gap-4 p-5 rounded-3xl border border-slate-100 bg-white hover:border-slate-900 hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-lg font-black text-slate-900 truncate leading-none">{booking.venueName}</p>
                        <StatusBadge status={booking.status} className="scale-90 origin-left" />
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(booking.startDate)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black text-slate-900 tabular-nums">{formatCurrency(booking.totalAmount, booking.currency)}</p>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Caché Total</p>
                    </div>
                    <div className="size-10 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <Link
                href="/artists/bookings"
                className="group inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-[13px] font-black text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 uppercase tracking-widest"
              >
                Bookings Histórico
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card title="Acciones" subtitle={hasPending ? 'Atención requerida' : 'Flujo al día'} tone={hasPending ? 'amber' : 'slate'}>
            {hasPending ? (
              <div className="space-y-4">
                <PendingActionItem
                  title="Revisiones Pendientes"
                  description="Responde propuestas y firma contratos para asegurar tus fechas."
                  dueDate={new Date().toISOString()}
                  urgent={metrics.pendingActionsCount > 2}
                />
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                  <p className="text-[10px] font-black text-amber-900 uppercase tracking-[0.15em] leading-relaxed">
                    La validación de documentos es crítica para el cobro de anticipos.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Operación al día</p>
              </div>
            )}
          </Card>

          <Card title="Métricas" subtitle="Ciclo actual" tone="slate">
            <div className="bg-slate-50 rounded-2xl p-6 space-y-5 border border-slate-100">
              <StatLine label="Bookings Activos" value={metrics.activeBookingsCount} />
              <StatLine label="Shows Próximos" value={metrics.upcomingBookingsCount} />
              <div className="h-px bg-slate-200 my-2" />
              <StatLine label="Ingreso Previsto" value={formatCurrencySafe(metrics.expectedIncome)} />
              <StatLine label="Ingreso Confirmado" value={formatCurrencySafe(metrics.confirmedIncome)} />
              <div className="h-px bg-slate-200 my-2" />
              <StatLine label="Días Bloqueados" value={metrics.blockedDaysCount} />
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

export default withRole(ArtistDashboardPage, ['ARTIST']);

function KpiCard({ icon, label, value, tone = 'slate' }: { icon: React.ReactNode; label: string; value: string | number; tone?: 'slate' | 'emerald' | 'amber' }) {
  const accentBg = {
    slate: 'bg-slate-900',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col group hover:border-slate-400 transition-colors">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-50 bg-slate-50/50">
        <div className="text-slate-400 group-hover:text-slate-900 transition-colors">
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <div className={`px-4 py-5 ${accentBg} text-white`}>
        <p className="text-2xl font-black tracking-tighter tabular-nums leading-none">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children, tone = 'slate' }: { title: string; subtitle?: string; children: React.ReactNode; tone?: 'slate' | 'amber' }) {
  const borderClass = tone === 'amber' ? 'border-amber-200' : 'border-slate-200';
  return (
    <section className={`rounded-[2rem] border ${borderClass} bg-white shadow-sm overflow-hidden flex flex-col`}>
      <header className="px-8 py-8 border-b border-slate-50 flex flex-col gap-1">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h2>
        {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{subtitle}</p>}
      </header>
      <div className="p-8 flex-1">
        {children}
      </div>
    </section>
  );
}

function PendingActionItem({ title, description, dueDate, urgent }: { title: string; description: string; dueDate: string; urgent: boolean }) {
  const toneBg = urgent ? 'bg-amber-500' : 'bg-slate-900';
  return (
    <div className="flex items-start gap-5 p-6 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm">
      <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${toneBg} text-white shadow-lg shadow-slate-200`}>
        <Clock className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</p>
        <p className="text-[13px] text-slate-500 leading-snug mt-1 font-medium">{description}</p>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
          <Calendar className="h-3 w-3 text-slate-300" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vence: {formatDate(dueDate)}</span>
        </div>
      </div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</span>
      <span className="text-sm font-black text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return value;
  }
}

function formatCurrencySafe(amount?: number | null, currency: string = 'EUR') {
  if (amount === null || amount === undefined) return '—';
  return formatCurrency(amount, currency);
}
