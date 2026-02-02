import Link from 'next/link';
import { AlertCircle, ArrowRight, Calendar, Clock, CreditCard } from 'lucide-react';

import { useVenueDashboard } from '@/hooks/venues/useVenueDashboard';
import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';

type PendingActionType = 'payment' | 'response' | 'document';
type PendingAction = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  type: PendingActionType;
  urgent: boolean;
  amount?: number;
};

function VenueDashboardPage() {
  const { data, loading } = useVenueDashboard();

  if (loading) {
    return <div className="p-8">Cargando dashboard…</div>;
  }

  if (!data) {
    return <div className="p-8">No hay datos disponibles</div>;
  }

  const { metrics, upcomingBookings } = data;
  const activeBookings = upcomingBookings;

  const alerts = metrics.pendingActionsCount > 0
    ? [{ id: 'pending', message: 'Tienes acciones pendientes que requieren tu atención.' }]
    : [];

  const pendingActions: PendingAction[] = metrics.pendingActionsCount > 0
    ? [{
      id: 'action-1',
      title: 'Revisa tus contrataciones pendientes',
      description: 'Completa los pasos para avanzar con tus bookings.',
      dueDate: new Date().toISOString(),
      type: 'response',
      urgent: metrics.pendingActionsCount > 2,
      amount: undefined,
    }]
    : [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Control operativo del venue</h1>
        <p className="text-slate-600">Sigue tus contrataciones activas, próximas fechas y acciones pendientes.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Bookings activos" value={metrics.activeBookingsCount} />
        <Kpi title="Próximos bookings" value={metrics.upcomingBookingsCount} />
        <Kpi title="Gastos previstos" value={formatCurrency(metrics.expectedSpent, 'EUR')} />
        <Kpi title="Gastos confirmados" value={formatCurrency(metrics.confirmedSpent, 'EUR')} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Bookings activos</h2>
              <span className="text-sm text-slate-500">{activeBookings.length} contrataciones</span>
            </div>

            {activeBookings.length === 0 ? (
              <div className="text-sm text-slate-500">No hay bookings activos.</div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                {activeBookings.map((booking, index) => (
                  <Link
                    key={booking.bookingId}
                    href={`/bookings/${booking.bookingId}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-slate-900 truncate">{booking.artistName}</p>
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
                      <p className="font-medium text-slate-900">
                        {formatCurrency(booking.totalAmount, booking.currency)}
                      </p>
                      <p className="text-xs text-slate-500">caché base</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Link
                href="/venues/bookings"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Ver todos los bookings
              </Link>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {alerts.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50/80 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Alertas
              </h3>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="text-sm text-slate-700">
                    {alert.message}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Acciones pendientes</h3>
            <div className="space-y-4">
              {pendingActions.length === 0 && (
                <p className="text-sm text-slate-500">No tienes acciones pendientes.</p>
              )}

              {pendingActions.map((action, index) => (
                <div
                  key={action.id}
                  className="flex items-start gap-3 animate-[fadeIn_0.2s_ease]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`p-2 rounded-lg ${action.urgent ? 'bg-red-50' : 'bg-slate-100'}`}>
                    {action.type === 'payment' && (
                      <CreditCard className={`h-4 w-4 ${action.urgent ? 'text-red-600' : 'text-slate-500'}`} />
                    )}
                    {action.type === 'response' && (
                      <Clock className={`h-4 w-4 ${action.urgent ? 'text-red-600' : 'text-slate-500'}`} />
                    )}
                    {action.type === 'document' && (
                      <AlertCircle className={`h-4 w-4 ${action.urgent ? 'text-red-600' : 'text-slate-500'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{action.title}</p>
                    <p className="text-sm text-slate-500 truncate">{action.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>Vence: {formatDate(action.dueDate)}</span>
                      {action.amount && (
                        <span className="font-medium text-slate-800">{formatCurrency(action.amount, 'EUR')}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Resumen del mes</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <StatRow label="Bookings confirmados" value={metrics.activeBookingsCount} />
              <StatRow label="En negociación" value={metrics.upcomingBookingsCount - metrics.activeBookingsCount} />
              <StatRow label="Volumen comprometido" value={formatCurrency(metrics.expectedSpent, 'EUR')} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withRole(VenueDashboardPage, ['VENUE']);

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatCurrency(amount: number, currency: string) {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}
