
import Link from 'next/link';
import { ArrowRight, Calendar, AlertCircle, Clock, CreditCard, FileText } from 'lucide-react';
import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';

import { usePromoterDashboard } from '@/hooks/promoter/usePromoterDashboard';

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}


function PromoterDashboardPage() {
  const { data, loading } = usePromoterDashboard();

  if (loading) {
    return <div className="p-8">Cargando dashboard…</div>;
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Control del promotor
        </h1>
        <p className="text-slate-600">
          Gestiona tus eventos, presupuestos y estados de contratación.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Eventos creados" value={metrics.totalEvents} />
        <Kpi title="Eventos activos" value={metrics.activeEvents} />
        <Kpi title="En borrador" value={metrics.draftEvents} />
        <Kpi title="Artistas confirmados" value={metrics.confirmedArtists ?? 0} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Eventos activos */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Eventos activos</h2>
              <span className="text-sm text-slate-500">
                {events.length} eventos
              </span>
            </div>

            {events.length === 0 ? (
              <div className="text-sm text-slate-500">
                No tienes eventos activos.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                {events.map((event: any, index: number) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-slate-900 truncate">
                          {event.name}
                        </p>
                        <StatusBadge status={event.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.start_date)}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Link
                href="/promoter/events"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Ver todos los eventos
              </Link>
            </div>
          </section>
        </div>

        {/* Lateral */}
        <div className="space-y-6">
          <section className="rounded-xl border border-amber-200 bg-amber-50/80 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Acciones pendientes
            </h3>
            {metrics.pendingActionsCount === 0 ? (
              <p className="text-sm text-slate-700">No tienes acciones pendientes.</p>
            ) : (
              <div className="space-y-2 text-sm text-slate-700">
                {metrics.pendingContractsCount > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-700" />
                    <span>Contratos por firmar: {metrics.pendingContractsCount}</span>
                  </div>
                )}
                {metrics.pendingPaymentsCount > 0 && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-amber-700" />
                    <span>Pagos pendientes: {metrics.pendingPaymentsCount}</span>
                  </div>
                )}
                {metrics.pendingResponsesCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-700" />
                    <span>Respuestas pendientes: {metrics.pendingResponsesCount}</span>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-4">
              Perfil del promotor
            </h3>
            <div className="text-sm text-slate-600 space-y-1">
              <div className="font-medium text-slate-900">{profile.name}</div>
              <div>ID: {profile.id}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withRole(PromoterDashboardPage, ['PROMOTER']);
