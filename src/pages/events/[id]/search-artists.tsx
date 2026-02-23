import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Euro, Loader2, MapPin, Music, Search, Ticket, UserPlus2 } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useArtists } from '@/hooks/artists/useArtists';
import { eventsService } from '@/services/events/events.service';
import {
  getArtistAvailability,
  getArtistProfileById,
} from '@/services/artists/artists.service';
import type { Event } from '@/types/event';
import { formatCurrency } from '@/lib/utils';

type Filters = {
  date?: string;
  budget?: string;
  genre?: string;
  city?: string;
};

type ArtistRow = {
  id: string;
  name: string;
};

type ArtistProfileLite = {
  basePrice?: number | null;
  currency?: string | null;
  city?: string | null;
  genres?: string[] | null;
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
  const [filteredArtists, setFilteredArtists] = useState<ArtistRow[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [filterApplied, setFilterApplied] = useState(false);
  const [profilesById, setProfilesById] = useState<Record<string, ArtistProfileLite>>({});
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
      const nextMap: Record<string, ArtistProfileLite> = {};
      rows.forEach((row) => {
        if (!row) return;
        nextMap[row.id] = {
          basePrice: row.profile?.basePrice ?? row.profile?.base_price ?? null,
          currency: row.profile?.currency ?? null,
          city: row.profile?.city ?? null,
          genres: Array.isArray(row.profile?.genres) ? row.profile.genres : null,
        };
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

  const applyAvailabilityFilter = useCallback(
    async (date: string) => {
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
        setFilteredArtists(checks.filter(Boolean) as ArtistRow[]);
        setFilterApplied(true);
      } catch (err: unknown) {
        setFilterError(
          err instanceof Error ? err.message : 'No se pudo aplicar el filtro'
        );
      } finally {
        setFiltering(false);
      }
    },
    [artists, user?.token]
  );

  async function handleApplyFilters() {
    if (!user?.token) return;
    setFiltering(true);
    setFilterError(null);

    try {
      let current: ArtistRow[] = [...artists];
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
        current = checks.filter(Boolean) as ArtistRow[];
      }

      setFilteredArtists(current);
      setFilterApplied(true);
    } catch (err: unknown) {
      setFilterError(
        err instanceof Error ? err.message : 'No se pudo aplicar el filtro',
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
  }, [applyAvailabilityFilter, artists.length, filters.date, user?.token]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 selection:bg-amber-500/30 selection:text-amber-900">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
            Evento · Buscar artistas
          </p>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 truncate">
                {event?.name ?? 'Evento'}
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
                Filtra artistas disponibles y envía invitaciones con contexto del evento.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
                <Ticket className="h-5 w-5" />
              </div>
            </div>
          </div>
        </header>

        {loadingEvent && (
          <section className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] inline-flex items-center gap-3 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            Cargando evento…
          </section>
        )}

        {!loadingEvent && event ? (
          <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <Search className="w-4.5 h-4.5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Criterios</h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      La fecha se usa para disponibilidad. El resto afina el match.
                    </p>
                  </div>
                </div>

                {filterApplied ? (
                  <button
                    type="button"
                    onClick={() => {
                      const festivalDate = filters.date;
                      setFilterApplied(false);
                      setFilteredArtists([]);
                      setFilterError(null);
                      setFilters((prev) => ({
                        ...prev,
                        budget: '',
                        genre: '',
                        city: '',
                      }));
                      if (festivalDate) {
                        void applyAvailabilityFilter(festivalDate);
                      }
                    }}
                    className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-amber-700 transition-colors"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    Fecha
                  </span>
                  <input
                    type="date"
                    value={filters.date ?? ''}
                    disabled
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 inline-flex items-center gap-2">
                    <Euro className="h-4 w-4 text-slate-400" />
                    Presupuesto máx.
                  </span>
                  <input
                    type="number"
                    value={filters.budget ?? ''}
                    onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="Ej. 1000"
                    inputMode="numeric"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 inline-flex items-center gap-2">
                    <Music className="h-4 w-4 text-slate-400" />
                    Género
                  </span>
                  <input
                    value={filters.genre ?? ''}
                    onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="Ej. techno"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    Ciudad
                  </span>
                  <input
                    value={filters.city ?? ''}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                    placeholder="Ej. Barcelona"
                  />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-medium">
                  {filterApplied && filters.date ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Disponibilidad filtrada para {filters.date}
                    </span>
                  ) : (
                    <span>Consejo: aplica filtros para reducir la lista antes de invitar.</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleApplyFilters}
                  disabled={filtering || !user?.token}
                  className="h-11 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {filtering ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {filtering ? 'Aplicando…' : 'Aplicar filtros'}
                </button>
              </div>

              {filterError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
                  {filterError}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Artistas</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {visibleArtists.length} resultado{visibleArtists.length === 1 ? '' : 's'}
            </span>
          </div>

          {artistsLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] inline-flex items-center gap-3 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              Cargando artistas…
            </div>
          ) : artistsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
              No se pudieron cargar los artistas.
            </div>
          ) : visibleArtists.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No hay artistas disponibles para los filtros actuales.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleArtists.map((artist) => {
                const profile = profilesById[artist.id];
                const price =
                  profile?.basePrice !== null && profile?.basePrice !== undefined
                    ? formatCurrency(Number(profile.basePrice), String(profile?.currency ?? 'EUR'))
                    : null;

                return (
                  <article
                    key={artist.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:border-amber-200 transition"
                  >
                    <header className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">
                            {artist.name?.slice(0, 1)?.toUpperCase() || 'A'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{artist.name}</p>
                            <p className="text-xs text-slate-500 inline-flex items-center gap-1 truncate">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {profile?.city || '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {price ? (
                          <>
                            <p className="text-sm font-black text-slate-900 tabular-nums">{price}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Caché base
                            </p>
                          </>
                        ) : (
                          <p className="text-[11px] font-medium text-slate-500">Sin caché</p>
                        )}
                      </div>
                    </header>

                    {Array.isArray(profile?.genres) && profile?.genres.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {profile.genres.slice(0, 4).map((g) => (
                          <span key={g} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                            {g}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={`/artists/profile/${artist.id}?eventId=${id ?? ''}&date=${filters.date ?? ''}`}
                        className="h-11 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition"
                      >
                        Ver perfil
                        <ArrowRight className="h-4 w-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleInvite(artist.id)}
                        disabled={sendingId === artist.id || !user?.token}
                        className="h-11 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-amber px-4 text-xs font-black uppercase tracking-widest text-amber-950 shadow-[0_10px_30px_rgba(245,158,11,0.18)] hover:bg-amber-400 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {sendingId === artist.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus2 className="h-4 w-4" />}
                        {sendingId === artist.id ? 'Enviando…' : 'Invitar'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
