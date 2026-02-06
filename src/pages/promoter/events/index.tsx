import Link from 'next/link';
import { Calendar, ArrowRight, Plus, LayoutGrid, Search } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePromoterEvents } from '@/hooks/promoter/usePromoterEvents';

function PromoterEventsPage() {
  const { events, loading } = usePromoterEvents();

  return (
    <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-12 bg-white min-h-screen">
      <header className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-slate-900" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Artime OS • Promoter Control</p>
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Eventos</h1>
              <p className="text-slate-500 font-medium text-lg max-w-2xl">Control centralizado de producciones, fechas y estados operativos.</p>
            </div>
          </div>

          <Link
            href="/events/new"
            className="hidden md:flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-[13px] font-black text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" />
            Crear Evento
          </Link>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-slate-900" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Catálogo de Producciones</h2>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {events.length} {events.length === 1 ? 'evento' : 'eventos'} registrados
          </span>
        </div>

        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando base de datos...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
              <div className="size-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300">
                <Search className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Sin eventos activos</p>
                <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                  No se han encontrado registros de eventos en tu cuenta de promotor. Comienza creando tu primera producción.
                </p>
              </div>
              <Link
                href="/events/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-[13px] font-black text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 uppercase tracking-widest"
              >
                Crear mi primer evento
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map((event: any, index: number) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center gap-6 px-8 py-6 hover:bg-slate-50/50 transition-all group"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="size-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/10 group-hover:scale-105 transition-transform shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-black text-slate-900 truncate leading-none tracking-tight">
                        {event.name}
                      </p>
                      <StatusBadge status={event.status} className="scale-90 origin-left" />
                    </div>

                    <div className="flex items-center gap-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {formatDate(event.start_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gestionar</p>
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Detalles</p>
                    </div>
                    <div className="size-10 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="md:hidden pt-4">
        <Link
          href="/events/new"
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-[13px] font-black text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" />
          Crear Evento
        </Link>
      </div>
    </main>
  );
}

export default withRole(PromoterEventsPage, ['PROMOTER']);

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return value;
  }
}
