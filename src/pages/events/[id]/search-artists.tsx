import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import {
  Search,
  Filter,
  Users,
  Calendar,
  Euro,
  MapPin,
  Music,
  ArrowRight,
  Clock,
  AlertCircle,
  ChevronLeft,
  Sparkles,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/hooks/auth/useAuth';
import { useArtists } from '@/hooks/artists/useArtists';
import { eventsService } from '@/services/events/events.service';
import {
  getArtistAvailability,
  getArtistProfileById,
} from '@/services/artists/artists.service';
import type { Event } from '@/types/event';

type Filters = {
  date?: string;
  budget?: string;
  genre?: string;
  city?: string;
};

export default function EventSearchArtistsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { artists, artistsLoading, artistsError } = useArtists();

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [filteredArtists, setFilteredArtists] = useState<any[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [filterApplied, setFilterApplied] = useState(false);
  const [profilesById, setProfilesById] = useState<
    Record<string, any>
  >({});
  const autoFilteredRef = useRef(false);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    if (!user?.token) return;

    setLoadingEvent(true);
    eventsService
      .getEvent(id, user.token)
      .then((data) => {
        setEvent(data);
        setFilters({
          date: data.start_date
            ? new Date(data.start_date).toISOString().slice(0, 10)
            : '',
          budget:
            data.estimatedBudget !== null &&
            data.estimatedBudget !== undefined
              ? String(data.estimatedBudget)
              : '',
          genre: '',
          city: '',
        });
      })
      .finally(() => setLoadingEvent(false));
  }, [id, user?.token]);

  useEffect(() => {
    if (!user?.token || artists.length === 0) return;

    Promise.all(
      artists.map((artist) =>
        getArtistProfileById(artist.id, user.token)
          .then((profile) => ({ id: artist.id, profile }))
          .catch(() => null)
      )
    ).then((rows) => {
      const nextMap: Record<string, any> = {};
      rows.forEach((row) => {
        if (row) nextMap[row.id] = row.profile;
      });
      setProfilesById(nextMap);
    });
  }, [artists, user?.token]);

  const visibleArtists = useMemo(() => {
    return filterApplied ? filteredArtists : artists;
  }, [filterApplied, filteredArtists, artists]);

  async function handleInvite(artistId: string) {
    if (!event || !user?.token) return;
    setSendingId(artistId);
    try {
      await eventsService.sendInvitation(event.id, artistId, user.token);
    } finally {
      setSendingId(null);
    }
  }

  async function applyAvailabilityFilter(date: string) {
    if (!user?.token) return;
    setFiltering(true);
    setFilterError(null);

    try {
      const checks = await Promise.all(
        artists.map(async (artist) => {
          const availability = await getArtistAvailability(
            artist.id,
            date,
            date,
            user.token
          );
          const day = availability?.days?.[0];
          return day?.status === 'AVAILABLE' ? artist : null;
        })
      );
      setFilteredArtists(checks.filter(Boolean) as any[]);
      setFilterApplied(true);
    } catch (err: any) {
      setFilterError(
        err?.message || 'No se pudo aplicar el filtro',
      );
    } finally {
      setFiltering(false);
    }
  }

  async function handleApplyFilters() {
    if (!user?.token) return;
    setFiltering(true);
    setFilterError(null);

    try {
      let current = [...artists];
      const budget = filters.budget
        ? Number(filters.budget)
        : null;
      const genre = filters.genre?.trim().toLowerCase() ?? '';
      const city = filters.city?.trim().toLowerCase() ?? '';

      if (budget !== null && !Number.isNaN(budget)) {
        current = current.filter((artist) => {
          const profile = profilesById[artist.id];
          if (!profile || profile.basePrice === undefined || profile.basePrice === null) {
            return false;
          }
          return Number(profile.basePrice) <= budget;
        });
      }

      if (genre) {
        current = current.filter((artist) => {
          const profile = profilesById[artist.id];
          if (!profile || !Array.isArray(profile.genres)) return false;
          return profile.genres.some((g: string) =>
            String(g).toLowerCase().includes(genre)
          );
        });
      }

      if (city) {
        current = current.filter((artist) => {
          const profile = profilesById[artist.id];
          if (!profile || !profile.city) return false;
          return String(profile.city).toLowerCase().includes(city);
        });
      }

      if (filters.date) {
        const checks = await Promise.all(
          current.map(async (artist) => {
            const availability = await getArtistAvailability(
              artist.id,
              filters.date as string,
              filters.date as string,
              user.token
            );
            const day = availability?.days?.[0];
            return day?.status === 'AVAILABLE' ? artist : null;
          })
        );
        current = checks.filter(Boolean) as any[];
      }

      setFilteredArtists(current);
      setFilterApplied(true);
    } catch (err: any) {
      setFilterError(
        err?.message || 'No se pudo aplicar el filtro',
      );
    } finally {
      setFiltering(false);
    }
  }

  useEffect(() => {
    if (autoFilteredRef.current) return;
    if (!user?.token || artists.length === 0) return;
    if (!filters.date) return;
    autoFilteredRef.current = true;
    void applyAvailabilityFilter(filters.date);
  }, [artists, filters.date, user?.token]);

  return (
    <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <Link href={`/events/${id}`} className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">
        <ChevronLeft className="h-4 w-4" />
        Volver al evento
      </Link>

      <header className="border-b border-slate-100 pb-8 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-900" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Artime OS · Artist Discovery</p>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          {event?.name ?? 'Explorar artistas'}
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Filtra el roster global de artistas según disponibilidad, género y presupuesto para tu producción.
        </p>
      </header>

      {loadingEvent ? (
        <div className="flex items-center gap-2 text-slate-400 animate-pulse font-medium text-sm">
          <Clock className="h-4 w-4" />
          <span>Cargando parámetros del evento...</span>
        </div>
      ) : (
        <Card title="Panel de filtros" subtitle="Criterios de búsqueda operativa" icon={<Filter className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Field label="Fecha del evento" helper="Campo fijo">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="date"
                  value={filters.date ?? ''}
                  disabled
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-[13px] font-bold text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
            </Field>

            <Field label="Presupuesto máx." helper="EUR Neto">
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="number"
                  placeholder="0.00"
                  value={filters.budget ?? ''}
                  onChange={(e) =>
                    setFilters({ ...filters, budget: e.target.value })
                  }
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
                />
              </div>
            </Field>

            <Field label="Género artístico">
              <div className="relative">
                <Music className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  placeholder="Ej: Rock, Jazz..."
                  value={filters.genre ?? ''}
                  onChange={(e) =>
                    setFilters({ ...filters, genre: e.target.value })
                  }
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
                />
              </div>
            </Field>

            <Field label="Ubicación / Ciudad">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  placeholder="Ej: Madrid..."
                  value={filters.city ?? ''}
                  onChange={(e) =>
                    setFilters({ ...filters, city: e.target.value })
                  }
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
                />
              </div>
            </Field>
          </div>

          <div className="pt-6 border-t border-slate-50 mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <Users className="size-4" />
                <span>{artists.length} artistas en base de datos</span>
             </div>
             <button
              onClick={handleApplyFilters}
              disabled={filtering}
              className="h-11 px-8 rounded-xl bg-slate-900 text-white text-[13px] font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
            >
              {filtering ? 'Procesando filtros...' : (
                <>
                  <Search className="h-4 w-4" />
                  Ejecutar búsqueda avanzada
                </>
              )}
            </button>
          </div>

          {filterError && (
            <div className="mt-4 p-3 rounded-lg border border-red-100 bg-red-50 text-red-600 text-[12px] font-bold flex items-center gap-2">
              <AlertCircle className="size-4" />
              {filterError}
            </div>
          )}
        </Card>
      )}

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-1 w-6 bg-slate-900 rounded-full" />
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
             {filterApplied ? `Resultados del filtrado (${visibleArtists.length})` : 'Roster General de Artistas'}
          </h2>
        </div>

        {artistsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-slate-50 border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : artistsError ? (
          <div className="p-8 rounded-3xl border border-red-100 bg-red-50 text-center">
             <AlertCircle className="size-8 text-red-300 mx-auto mb-2" />
             <p className="text-red-700 font-bold">Error de conexión al roster</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleArtists.map((artist) => {
              const profile = profilesById[artist.id];
              return (
                <div
                  key={artist.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-900 hover:shadow-xl hover:shadow-slate-900/5 transition-all group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="size-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <Users className="size-6" />
                      </div>
                      {profile?.basePrice !== undefined && (
                        <div className="text-right">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Caché base</p>
                           <p className="text-lg font-black text-slate-900 tabular-nums">
                            {profile.basePrice} {profile.currency ?? 'EUR'}
                           </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-slate-900 transition-colors leading-tight">{artist.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile?.genres?.slice(0, 2).map((g: string) => (
                          <span key={g} className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-500 px-2 py-0.5 rounded">
                            {g}
                          </span>
                        )) || <span className="text-[10px] text-slate-400">Género sin definir</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium pt-2">
                       <MapPin className="size-3.5 text-slate-400" />
                       <span>{profile?.city || 'Ubicación remota'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 mt-8">
                    <Link
                      href={`/artists/profile/${artist.id}?eventId=${id ?? ''}&date=${filters.date ?? ''}`}
                      className="h-10 rounded-xl border border-slate-200 bg-white text-[12px] font-bold text-slate-700 flex items-center justify-center hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm"
                    >
                      Examinar perfil
                    </Link>
                    <button
                      onClick={() => handleInvite(artist.id)}
                      disabled={sendingId === artist.id}
                      className="h-10 rounded-xl bg-slate-900 text-white text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/10"
                    >
                      {sendingId === artist.id ? (
                         <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="size-3.5" />
                          Enviar invitación
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {filterApplied && visibleArtists.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                 <div className="size-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
                    <Search className="size-6 text-slate-300" />
                 </div>
                 <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Sin coincidencias operativas</p>
                 <p className="text-[13px] text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">No hay artistas disponibles que cumplan con todos los criterios de filtrado para esta fecha.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function Card({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <header className="px-6 py-6 border-b border-slate-50 bg-white flex items-center gap-4">
        <div className="size-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h2>
          {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">{subtitle}</p>}
        </div>
      </header>
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</label>
        {helper && <span className="text-[10px] font-bold text-slate-400 italic">{helper}</span>}
      </div>
      {children}
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <Clock className={`animate-spin ${className}`} />;
}
