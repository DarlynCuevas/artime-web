import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Calendar, Eye, Plus, Sparkles, Clock, AlertCircle, ChevronRight, LayoutList } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { eventsService } from '@/services/events/events.service';
import type { Event } from '@/types/event';

export default function EventsPage() {
  const { user } = useAuth();
  const { role } = useMe();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const canCreateEvent = role === 'VENUE';

  useEffect(() => {
    if (!user?.token) return;

    eventsService
      .getEvents(user.token)
      .then(setEvents)
      .catch(() => setError('No se pudieron cargar los eventos'))
      .finally(() => setLoading(false));
  }, [user?.token]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 animate-pulse font-medium text-sm">
          <Clock className="h-4 w-4" />
          <span>Cargando gestor de eventos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto rounded-xl border border-red-100 bg-red-50 p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <header className="border-b border-slate-100 pb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-900" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Artime OS · Event Manager</p>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Gestión de eventos</h1>
          <p className="text-sm text-slate-500 max-w-2xl">Control de visibilidad, programación y estados operativos de tus producciones.</p>
        </div>
        {canCreateEvent && (
          <button
            type="button"
            onClick={() => router.push('/events/new')}
            className="hidden md:inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-slate-900 text-white text-[13px] font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Publicar nuevo evento
          </button>
        )}
      </header>

      {canCreateEvent && (
        <button
          type="button"
          onClick={() => router.push('/events/new')}
          className="md:hidden w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-slate-900 text-white text-[13px] font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Publicar nuevo evento
        </button>
      )}

      {events.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 bg-white">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6 text-slate-300" />
          </div>
          <h3 className="text-slate-900 font-bold tracking-tight uppercase text-[13px]">Sin eventos activos</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto font-medium">Aún no has registrado ningún evento en el sistema. Comienza creando tu primera producción.</p>
          {canCreateEvent && (
            <button
              type="button"
              onClick={() => router.push('/events/new')}
              className="mt-6 text-[12px] font-black uppercase tracking-widest text-slate-900 hover:underline"
            >
              Crear mi primer evento →
            </button>
          )}
        </div>
      ) : (
        <Card title="Listado de producciones" subtitle={`${events.length} registros encontrados`} icon={<LayoutList className="h-4 w-4" />}>
          <div className="divide-y divide-slate-100 -mx-6">
            {events.map((event) => (
              <div key={event.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 px-6 py-6 hover:bg-slate-50/50 transition-all group items-center">
                <div className="md:col-span-5 space-y-1">
                  <p className="font-bold text-slate-900 leading-tight group-hover:text-black transition-colors">{event.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">UUID:</span>
                    <span className="text-[11px] font-mono text-slate-400 truncate">{event.id}</span>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <div className="flex items-center gap-2.5 text-[13px] text-slate-600 font-bold bg-white border border-slate-100 px-3 py-1.5 rounded-lg w-fit shadow-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{event.start_date ? formatDate(event.start_date) : 'Fecha pendiente'}</span>
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <StatusPill label={event.status} tone="slate" />
                  <StatusPill label={event.visibility} tone="amber" />
                </div>

                <div className="md:col-span-2 text-right">
                  <Link
                    href={`/events/${event.id}`}
                    className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-white border border-slate-200 text-[13px] font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm group/btn"
                  >
                    Ver detalle
                    <Eye className="ml-2 h-4 w-4 transition-transform group-hover/btn:scale-110" />
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

function Card({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <header className="px-6 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-slate-900 p-2 text-white shadow-sm">{icon}</div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-none tracking-tight">{title}</h2>
            {subtitle && <p className="text-[12px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{subtitle}</p>}
          </div>
        </div>
      </header>
      <div className="px-6">
        {children}
      </div>
    </section>
  );
}

function StatusPill({ label, tone }: { label: string; tone?: 'slate' | 'amber' | 'emerald' }) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-800'
      : tone === 'emerald'
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${toneClass} border border-transparent`}>
      {label}
    </span>
  );
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return date;
  }
}
