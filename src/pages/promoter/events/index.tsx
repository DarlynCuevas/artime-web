import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePromoterDashboard } from '@/hooks/promoter/usePromoterDashboard';

function PromoterEventsPage() {
  const { data, loading } = usePromoterDashboard();

  if (loading) {
    return <div className="p-8">Cargando eventos…</div>;
  }

  if (!data) {
    return <div className="p-8">No hay datos disponibles</div>;
  }

  const { events } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Eventos</p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Todos mis eventos
        </h1>
        <p className="text-slate-600">
          Gestiona el estado y progreso de tus eventos.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {events.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No has creado ningún evento todavía.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((event: any, index: number) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition group"
                style={{ animationDelay: `${index * 40}ms` }}
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
      </section>
    </div>
  );
}

export default withRole(PromoterEventsPage, ['PROMOTER']);

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}
