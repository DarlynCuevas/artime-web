import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { NextPage } from 'next';
import { ArrowRight, Building2, Filter, Loader2, MapPin, Music, Search } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import { getMyRepresentedArtists } from '@/services/managers/managers.service';
import { createVenueSuggestion } from '@/services/suggestions/suggestions.service';
import { discoverVenues } from '@/services/venues/discoverVenues.service';
import type { DiscoverVenue } from '@/types/venues/DiscoverVenue';

type RepresentedArtist = {
  id: string;
  name: string;
};

const ManagerDiscoverVenuesPage: NextPage = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState<DiscoverVenue[]>([]);
  const [representedArtists, setRepresentedArtists] = useState<RepresentedArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtistByVenue, setSelectedArtistByVenue] = useState<Record<string, string>>({});
  const [sendingToVenueId, setSendingToVenueId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [genre, setGenre] = useState('');

  const loadVenues = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await discoverVenues({
        city: city || undefined,
        genres: genre ? [genre] : undefined,
      });
      setVenues(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar las salas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
    if (!user?.token) return;
    getMyRepresentedArtists(user.token)
      .then((data) => setRepresentedArtists(Array.isArray(data) ? data : []))
      .catch(() => setRepresentedArtists([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const filteredVenues = useMemo(() => {
    const term = name.trim().toLowerCase();
    if (!term) return venues;
    return venues.filter((venue) => venue.name.toLowerCase().includes(term));
  }, [venues, name]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="relative w-full overflow-hidden bg-fintech-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-brand-amber opacity-15 blur-[128px]" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500 opacity-10 blur-[128px]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 sm:px-6">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/20">
              <Building2 className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Discover</p>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Buscar salas para proponer artistas</h1>
            </div>
          </div>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60">
              <Filter className="h-4 w-4" />
              Filtros
            </div>

            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Nombre</span>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                    placeholder="Nombre de la sala"
                  />
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Ciudad</span>
                <div className="relative">
                  <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                    placeholder="Barcelona"
                  />
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Genero</span>
                <div className="relative">
                  <Music className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                    placeholder="Pop"
                  />
                </div>
              </label>
            </div>

            <div>
              <button
                type="button"
                onClick={loadVenues}
                className="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black tracking-widest text-amber-950 uppercase hover:bg-amber-400 sm:w-auto"
              >
                Aplicar
              </button>
            </div>
          </section>
        </div>
      </div>

      <main className="mx-auto mt-6 max-w-6xl space-y-6 px-4 sm:px-6">
        {loading && (
          <div className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando salas...
          </div>
        )}

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {!loading && filteredVenues.length === 0 && !error && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No se encontraron salas con los filtros seleccionados.
          </div>
        )}

        {!loading && filteredVenues.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Resultado</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{filteredVenues.length} salas</span>
            </div>

            {feedback && (
              <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${feedback.type === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
                {feedback.text}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredVenues.map((venue) => {
                const selected = selectedArtistByVenue[venue.id] ?? representedArtists[0]?.id ?? '';
                return (
                  <div key={venue.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition hover:border-amber-200">
                    <div className="space-y-2">
                      <p className="text-lg font-black text-slate-900">{venue.name}</p>
                      <p className="flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {venue.city || 'Sin ciudad'}
                      </p>
                      {Array.isArray(venue.genres) && venue.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {venue.genres.map((item) => (
                            <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sugerir artista</span>
                        <Link
                          href={`/venues/profile/${venue.id}`}
                          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-amber-700"
                        >
                          Ver perfil
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      {representedArtists.length === 0 ? (
                        <p className="text-sm text-slate-500">No tienes artistas representados activos.</p>
                      ) : (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <select
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none"
                            value={selected}
                            onChange={(event) => {
                              setSelectedArtistByVenue((prev) => ({ ...prev, [venue.id]: event.target.value }));
                            }}
                          >
                            {representedArtists.map((artist) => (
                              <option key={artist.id} value={artist.id}>
                                {artist.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!selected || sendingToVenueId === venue.id || !user?.token}
                            onClick={async () => {
                              if (!user?.token || !selected) return;
                              setSendingToVenueId(venue.id);
                              setFeedback(null);
                              try {
                                await createVenueSuggestion(user.token, { venueId: venue.id, artistId: selected });
                                setFeedback({ type: 'ok', text: `Sugerencia enviada a ${venue.name}.` });
                              } catch (err: unknown) {
                                setFeedback({
                                  type: 'err',
                                  text: err instanceof Error ? err.message : 'No se pudo enviar la sugerencia',
                                });
                              } finally {
                                setSendingToVenueId(null);
                              }
                            }}
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-60"
                          >
                            {sendingToVenueId === venue.id ? 'Enviando...' : 'Enviar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default withRole(ManagerDiscoverVenuesPage, ['MANAGER']);
