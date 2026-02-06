
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, Calendar, CheckCircle2, ClipboardList, Clock, Coins, FileSignature, LayoutDashboard, Users } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePromoterDashboard } from '@/hooks/promoter/usePromoterDashboard';

const PAYMENT_STATUSES = ['CONTRACT_SIGNED', 'PAID_PARTIAL'] as const;

type StatusCopy = {
  label: string;
  tone: string;
};

type PromoterActionBooking = {
  id: string;
  artistName: string;
  eventName: string;
  date?: string | null;
  status: string;
  actionLabel?: string;
};

const actionCopyByStatus: Record<string, StatusCopy> = {
  PENDING: { label: 'Responder solicitud', tone: 'Confirma si quieres avanzar' },
  NEGOTIATING: { label: 'Responder negociación', tone: 'Cierra o ajusta la oferta' },
  FINAL_OFFER_SENT: { label: 'Responder oferta final', tone: 'Confirma condiciones finales' },
  ACCEPTED: { label: 'Enviar o firmar contrato', tone: 'Formaliza el acuerdo' },
  CONTRACT_SIGNED: { label: 'Programar pago', tone: 'Define calendario de pagos' },
  PAID_PARTIAL: { label: 'Completar pago pendiente', tone: 'Liquida el importe restante' },
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

  const profile = data.profile ?? { name: 'Promotor', id: '—' };
  const metrics = data.metrics ?? {
    totalEvents: 0,
    activeEvents: 0,
    draftEvents: 0,
    confirmedEvents: 0,
    confirmedArtists: 0,
    pendingContractsCount: 0,
    pendingPaymentsCount: 0,
    pendingResponsesCount: 0,
    pendingActionsCount: 0,
  };
  const events = data.events ?? [];
  const actionBookings: PromoterActionBooking[] = data.actionBookings ?? [];

  return (
    <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <header className="border-b border-slate-100 pb-6 mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-900" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Artime OS</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Control operativo del promotor</h1>
          <p className="text-sm text-slate-500 max-w-2xl">Gestión de eventos, bookings y flujos de pago en un solo panel.</p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard icon={<LayoutDashboard className="h-4 w-4" />} label="Eventos creados" value={metrics.totalEvents} />
        <KpiCard icon={<Users className="h-4 w-4" />} label="Eventos activos" value={metrics.activeEvents} tone="emerald" />
        <KpiCard icon={<ClipboardList className="h-4 w-4" />} label="Borradores" value={metrics.draftEvents} />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4" />} label="Artistas confirmados" value={metrics.confirmedArtists ?? 0} />
        <KpiCard icon={<FileSignature className="h-4 w-4" />} label="Contratos pendientes" value={metrics.pendingContractsCount ?? 0} tone="amber" />
        <KpiCard icon={<Coins className="h-4 w-4" />} label="Pagos pendientes" value={metrics.pendingPaymentsCount ?? 0} tone="amber" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <ActiveEventsBlock
            events={events}
            filteredEvents={filteredActiveEvents}
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
          <ActionBlock metrics={metrics} actionBookings={actionBookings} />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <ProfileBlock profile={profile} />
        </div>
      </section>
    </main>
  );
}

export default withRole(PromoterDashboardPage, ['PROMOTER']);

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

function ActiveEventsBlock({
  events,
  filteredEvents,
  statusFilter,
  onFilterChange,
}: {
  events: any[];
  filteredEvents: any[];
  statusFilter: string;
  onFilterChange: (value: string) => void;
}) {
  const statuses = Array.from(new Set(events.map((e) => e.status)));

  return (
    <Card title="Eventos activos" subtitle={`${filteredEvents.length} visibles`} icon={<Calendar className="h-4 w-4" />}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterChip label="Todos" active={statusFilter === 'ALL'} onClick={() => onFilterChange('ALL')} />
        {statuses.map((status) => (
          <FilterChip key={status} label={status} active={statusFilter === status} onClick={() => onFilterChange(status)} />
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
          <p className="text-sm text-slate-500">No tienes eventos en este filtro.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 -mx-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 px-6 py-5 hover:bg-slate-50/50 transition-all group items-center">
              <div className="md:col-span-6 space-y-1">
                <p className="font-bold text-slate-900 leading-tight truncate">{event.name}</p>
                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-tight">ID: {event.id}</p>
              </div>
              <div className="md:col-span-3 space-y-2 text-[13px] text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold">{event.start_date ? formatDate(event.start_date) : 'Sin fecha'}</span>
                </div>
              </div>
              <div className="md:col-span-2 flex items-center">
                <StatusBadge status={event.status} />
              </div>
              <div className="md:col-span-1 text-right">
                <Link
                  href={`/events/${event.id}`}
                  className="inline-flex items-center justify-center h-10 px-3 rounded-lg bg-white border border-slate-200 text-[13px] font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm"
                >
                  Ver
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Link
          href="/promoter/events"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
        >
          Ver todos los eventos
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}

function ActionBlock({ metrics, actionBookings }: { metrics: any; actionBookings: PromoterActionBooking[] }) {
  const hasMetrics = (metrics.pendingContractsCount ?? 0) > 0 || (metrics.pendingPaymentsCount ?? 0) > 0 || (metrics.pendingResponsesCount ?? 0) > 0;
  const hasActionBookings = actionBookings.length > 0;
  const hasActions = hasMetrics || hasActionBookings;

  return (
    <Card title="Acciones pendientes" subtitle={hasActions ? 'Atención requerida' : 'Flujo operativo al día'} tone={hasActions ? 'amber' : 'slate'} icon={<AlertCircle className="h-4 w-4" />}>
      {!hasActions ? (
        <div className="flex items-center gap-3 py-2 text-slate-500">
          <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ClipboardList className="h-4 w-4" />
          </div>
          <p className="text-sm">Todo está en orden.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hasMetrics && (
            <div className="space-y-2 text-sm text-slate-700">
              {metrics.pendingContractsCount > 0 && (
                <div className="flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-amber-700" />
                  <span>Contratos por firmar: {metrics.pendingContractsCount}</span>
                </div>
              )}
              {metrics.pendingPaymentsCount > 0 && (
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-700" />
                  <span>Pagos pendientes: {metrics.pendingPaymentsCount}</span>
                </div>
              )}
              {metrics.pendingResponsesCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-700" />
                  <span>Respuestas pendientes: {metrics.pendingResponsesCount}</span>
                </div>
              )}
            </div>
          )}

          <ActionBookingsList bookings={actionBookings} />
        </div>
      )}
    </Card>
  );
}

function ActionBookingsList({ bookings }: { bookings: PromoterActionBooking[] }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-white/70 p-4 space-y-3">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Crítico</p>
          <h3 className="text-base font-semibold text-slate-900">Bookings que requieren acción</h3>
          <p className="text-xs text-amber-800">Si el promotor no actúa aquí, nadie lo hará.</p>
        </div>
        <FileSignature className="h-5 w-5 text-amber-700" />
      </header>

      {bookings.length === 0 ? (
        <p className="text-sm text-amber-800">Nada pendiente ahora mismo.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const copy = actionCopyByStatus[booking.status] ?? { label: booking.actionLabel ?? 'Revisar booking', tone: booking.actionLabel ?? 'Revisa el booking' };
            const dateLabel = booking.date ? formatDate(booking.date) : 'Sin fecha';
            const isPaymentPending = PAYMENT_STATUSES.includes(booking.status as (typeof PAYMENT_STATUSES)[number]);

            return (
              <div key={booking.id} className="rounded-lg border border-amber-200 bg-white px-4 py-3 flex items-start gap-3 shadow-sm">
                <div className="mt-0.5">
                  {isPaymentPending ? <Coins className="h-5 w-5 text-amber-700" /> : <CheckCircle2 className="h-5 w-5 text-amber-700" />}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{booking.artistName}</p>
                      <p className="text-xs text-slate-500 truncate">{booking.eventName}</p>
                    </div>
                    <StatusBadge status={booking.status} className="shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>{dateLabel}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className={isPaymentPending ? 'text-amber-700 font-semibold truncate' : 'text-amber-700 font-medium truncate'}>
                      {isPaymentPending ? 'Pago pendiente' : copy.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{isPaymentPending ? 'Completa o programa el pago para seguir avanzando.' : copy.tone}</p>
                </div>
                <Link
                  href={`/bookings/${booking.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-900"
                >
                  Abrir
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfileBlock({ profile }: { profile: { name: string; id: string } }) {
  return (
    <Card title="Perfil" subtitle="Promotor" icon={<Users className="h-4 w-4" />}>
      <div className="text-sm text-slate-700 space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold uppercase">
            {profile.name?.slice(0, 2) ?? 'PR'}
          </div>
          <div>
            <p className="font-bold text-slate-900">{profile.name}</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ID: {profile.id}</p>
          </div>
        </div>
        <StatusBadge status="ACTIVE" className="w-fit" />
        <p className="text-xs text-slate-500">Los datos sensibles se gestionan en autenticación.</p>
      </div>
    </Card>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-[13px] font-bold transition-all shadow-sm ${
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-slate-900/10'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
    </button>
  );
}

function Card({ title, subtitle, children, icon, tone = 'slate' }: { title: string; subtitle?: string; children: React.ReactNode; icon?: React.ReactNode; tone?: 'slate' | 'amber' }) {
  const headerBg = tone === 'amber' ? 'bg-amber-50/50' : 'bg-white';
  const borderClass = tone === 'amber' ? 'border-amber-200' : 'border-slate-200';

  return (
    <section className={`rounded-2xl ${borderClass} border bg-white shadow-sm overflow-hidden flex flex-col`}>
      <header className={`px-6 py-5 border-b border-slate-50 ${headerBg}`}>
        <div className="flex items-center gap-3">
          {icon && <div className={`p-1.5 rounded-lg ${tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-slate-900 text-white shadow-sm'}`}>{icon}</div>}
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
            {subtitle && <p className="text-[12px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">{subtitle}</p>}
          </div>
        </div>
      </header>
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return value;
  }
}
