import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Calendar, Eye, Plus, Sparkles } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { eventsService } from '@/services/events/events.service';
import type { Event } from '@/types/event';

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { role } = useMe();
  const canCreateEvent = role === 'PROMOTER';

  useEffect(() => {
    if (!user?.token) return;

    eventsService
      .getEvents(user.token)
      .then(setEvents)
      .catch(() => setError('No se pudieron cargar los eventos'))
      .finally(() => setLoading(false));
  }, [user?.token]);

  if (loading) {
    return <div className="p-8 text-slate-700">Cargando eventos…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">Eventos</p>
          <h1 className="text-3xl font-semibold text-slate-900">Gestión de eventos</h1>
          <p className="text-slate-600">Visibilidad clara de fechas, estado y visibilidad.</p>
        </div>
        {canCreateEvent && (
          <button
            type="button"
            onClick={() => router.push('/events/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Crear evento
          </button>
        )}
      </header>

      {events.length === 0 && (
        <Card title="Sin eventos" icon={<Sparkles className="h-4 w-4 text-slate-600" />}>
          <p className="text-sm text-slate-600">Aún no has creado eventos. Empieza creando uno nuevo.</p>
        </Card>
      )}

      {events.length > 0 && (
        <Card title={`Eventos (${events.length})`} icon={<Calendar className="h-4 w-4 text-slate-600" />}>
          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <div key={event.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4">
                <div className="md:col-span-5">
                  <p className="font-semibold text-slate-900">{event.name}</p>
                  <p className="text-xs text-slate-500">ID: {event.id}</p>
                </div>
                <div className="md:col-span-3 text-sm text-slate-600">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{event.start_date ? formatDate(event.start_date) : 'Sin fecha'}</span>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <StatusPill label={event.status} tone="slate" />
                  <StatusPill label={event.visibility} tone="amber" />
                </div>
                <div className="md:col-span-2 text-right">
                  <Link href={`/events/${event.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 hover:text-slate-900">
                    Ver evento
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
      <header className="flex items-center gap-2">
        {icon && <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div>}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function StatusPill({ label, tone }: { label: string; tone?: 'slate' | 'amber' | 'emerald' }) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : tone === 'emerald'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>{label}</span>;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}
