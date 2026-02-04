
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, Calendar, CheckCircle2, ClipboardList, Coins, FileSignature, Users } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePromoterDashboard } from '@/hooks/promoter/usePromoterDashboard';

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
          <ActiveEventsBlock
            events={events}
            filteredEvents={filteredActiveEvents}
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
          <ActionBlock metrics={metrics} />
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
    slate: 'bg-slate-900 text-white',
    amber: 'bg-amber-600 text-white',
    emerald: 'bg-emerald-600 text-white',
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
        {icon}
        <span>{title}</span>
      </div>
      <div className={`px-4 py-4 ${toneClass}`}>
        <p className="text-3xl font-semibold">{value}</p>
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

function ActionBlock({ metrics }: { metrics: any }) {
  const hasActions = (metrics.pendingActionsCount ?? 0) > 0;
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/70 shadow-sm p-5 space-y-3">
      <header className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-700" />
        <div>
          <p className="text-sm font-medium text-amber-700">Acciones pendientes</p>
          <p className="text-xs text-amber-800">Si no actúas aquí, nadie lo hará.</p>
        </div>
      </header>

      {!hasActions ? (
        <p className="text-sm text-amber-800">No tienes acciones pendientes.</p>
      ) : (
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
    </section>
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
