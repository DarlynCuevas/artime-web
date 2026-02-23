import Link from 'next/link';
import { Calendar, ArrowRight, Sparkles, MapPin, Plus } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePromoterEvents } from '@/hooks/promoter/usePromoterEvents';

function PromoterEventsPage() {
  const { events, loading } = usePromoterEvents();

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-fintech-dark rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-0.5">Gestión</p>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Mis eventos</h1>
                </div>
              </div>
              <p className="text-white/50 text-sm max-w-xl ml-16">
                Gestiona el estado, fechas y line-up de todos tus eventos activos y pasados.
              </p>
            </div>

            <Link
              href="/events/new"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-brand-amber text-amber-950 font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all duration-200 shadow-[0_0_20px_rgba(251,191,36,0.2)] shrink-0"
            >
              <Plus className="w-4 h-4" />
              Crear evento
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <section className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Listado de eventos</h2>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{events.length} evento{events.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-pulse">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando eventos…</p>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center border-t border-slate-50">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-slate-300" />
                </div>
                <p className="font-black text-slate-900 text-sm">Aún no tienes eventos</p>
                <p className="text-xs text-slate-400 mt-1">Crea tu primer evento para comenzar a contratar artistas.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {events.map((event: any, index: number) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <p className="font-black text-slate-900 text-base">{event.name}</p>
                        <StatusBadge status={event.status} />
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {event.start_date ? formatDate(event.start_date) : 'Por confirmar'}
                        </span>
                        {event.city && (
                          <span className="flex items-center gap-1.5 hidden sm:flex">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.city}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visibilidad</p>
                        <p className="text-sm font-semibold text-slate-900">{event.visibility === 'PRIVATE' ? 'Privado' : 'Público'}</p>
                      </div>
                      <div className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-amber-300 group-hover:bg-amber-50 transition-all">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default withRole(PromoterEventsPage, ['PROMOTER']);

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}
