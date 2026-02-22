
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, Calendar, CheckCircle2, ClipboardList, Clock, Coins, FileSignature, Users } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePromoterDashboard } from '@/hooks/promoter/usePromoterDashboard';

const PAYMENT_STATUSES = ['CONTRACT_SIGNED', 'PAID_PARTIAL'] as const;

type PromoterActionBooking = {
  id: string;
  artistName: string;
  eventName: string;
  date?: string | null;
  status: string;
  actionLabel?: string;
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
    return <div className="p-8 text-slate-700">Cargando dashboard…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  if (!data) {
    return <div className="p-8">No hay datos disponibles</div>;
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
    <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Panel operativo del promotor</h1>
        <p className="text-slate-600">Visibilidad total de eventos, presupuestos y bookings.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Eventos creados" value={metrics.totalEvents} icon={<ClipboardList className="h-4 w-4" />} />
        <KpiCard title="Eventos activos" value={metrics.activeEvents} icon={<Users className="h-4 w-4" />} />
        <KpiCard title="Borradores" value={metrics.draftEvents} icon={<FileSignature className="h-4 w-4" />} tone="amber" />
        <KpiCard title="Artistas confirmados" value={metrics.confirmedArtists ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActionBlock metrics={metrics} actionBookings={actionBookings} />
          <ActiveEventsBlock
            events={events}
            filteredEvents={filteredActiveEvents}
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
        </div>
        <div className="space-y-6">
          <ProfileBlock profile={profile} />
        </div>
      </section>
    </main>
  );
}

export default withRole(PromoterDashboardPage, ['PROMOTER']);

function KpiCard({ title, value, icon, tone = 'slate' }: { title: string; value: string | number; icon: ReactNode; tone?: 'slate' | 'amber' | 'emerald' }) {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        {icon}
        <span>{title}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${toneClass}`}>
          {tone === 'emerald' ? 'Confirmado' : 'Operativo'}
        </span>
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
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Eventos</p>
          <h2 className="text-xl font-semibold text-slate-900">Activos y próximos</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip label="Todos" active={statusFilter === 'ALL'} onClick={() => onFilterChange('ALL')} />
          {statuses.map((status) => (
            <FilterChip key={status} label={status} active={statusFilter === status} onClick={() => onFilterChange(status)} />
          ))}
        </div>
      </header>

      {filteredEvents.length === 0 ? (
        <p className="text-sm text-slate-600">No tienes eventos en este filtro.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredEvents.map((event) => (
            <div key={event.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3">
              <div className="md:col-span-6">
                <p className="font-medium text-slate-900">{event.name}</p>
                <p className="text-xs text-slate-500">ID: {event.id}</p>
              </div>
              <div className="md:col-span-3 text-sm text-slate-600">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{event.start_date ? formatDate(event.start_date) : 'Sin fecha'}</span>
                </div>
              </div>
              <div className="md:col-span-2 flex items-center">
                <StatusBadge status={event.status} />
              </div>
              <div className="md:col-span-1 text-right">
                <Link href={`/events/${event.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 hover:text-slate-900">
                  Ver
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Link
          href="/promoter/events"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Ver todos los eventos
        </Link>
      </div>
    </section>
  );
}

function ActionBlock({ metrics, actionBookings }: { metrics: any; actionBookings: PromoterActionBooking[] }) {
  const negotiationCount = actionBookings.filter((b) => ['NEGOTIATING', 'FINAL_OFFER_SENT'].includes(b.status)).length;
  const paymentCount = actionBookings.filter((b) => PAYMENT_STATUSES.includes(b.status as (typeof PAYMENT_STATUSES)[number])).length;
  const responseCount = actionBookings.filter((b) => b.status === 'PENDING').length;

  const items = [
    negotiationCount > 0
      ? {
          key: 'negotiations',
          title: 'Negociaciones activas',
          description: `Tienes ${negotiationCount} booking${negotiationCount > 1 ? 's' : ''} en negociación.`,
          count: negotiationCount,
          urgent: negotiationCount >= 3,
        }
      : null,
    paymentCount > 0
      ? {
          key: 'payments',
          title: 'Pagos pendientes',
          description: `Tienes ${paymentCount} booking${paymentCount > 1 ? 's' : ''} con pago pendiente.`,
          count: paymentCount,
          urgent: paymentCount >= 2,
        }
      : null,
    responseCount > 0
      ? {
          key: 'responses',
          title: 'Respuestas pendientes',
          description: `Tienes ${responseCount} booking${responseCount > 1 ? 's' : ''} esperando respuesta.`,
          count: responseCount,
          urgent: responseCount >= 3,
        }
      : null,
    metrics.pendingContractsCount > 0
      ? {
          key: 'contracts',
          title: 'Contratos por firmar',
          description: `Tienes ${metrics.pendingContractsCount} contrato${metrics.pendingContractsCount > 1 ? 's' : ''} pendiente${metrics.pendingContractsCount > 1 ? 's' : ''}.`,
          count: metrics.pendingContractsCount,
          urgent: metrics.pendingContractsCount >= 2,
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; title: string; description: string; count: number; urgent: boolean }>;

  const hasActions = items.length > 0;

  return (
    <Card title="Acciones pendientes" subtitle={hasActions ? 'Requieren atención' : 'Sin pendientes'} tone={hasActions ? 'amber' : 'slate'}>
      {hasActions ? (
        <div className="space-y-4">
          {items.slice(0, 3).map((item) => (
            <PendingActionItem
              key={item.key}
              title={item.title}
              description={item.description}
              count={item.count}
              urgent={item.urgent}
            />
          ))}
          <Link
            href="/promoter/bookings"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Ver contrataciones
          </Link>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No tienes acciones pendientes.</p>
      )}
    </Card>
  );
}

function ProfileBlock({ profile }: { profile: { name: string; id: string } }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Perfil</p>
          <h3 className="text-lg font-semibold text-slate-900">Promotor</h3>
        </div>
        <StatusBadge status="ACTIVE" />
      </header>
      <div className="text-sm text-slate-700 space-y-1">
        <p className="font-medium text-slate-900">{profile.name}</p>
        <p className="text-xs text-slate-500">ID: {profile.id}</p>
      </div>
      <p className="text-xs text-slate-500">Los datos sensibles se gestionan en autenticación.</p>
    </section>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition shadow-sm ${
        active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}
