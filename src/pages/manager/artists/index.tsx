import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Filter, Loader2, MapPin, Music, Search, Users } from 'lucide-react';

import { discoverArtists } from '@/services/artists/discoverArtists.service';
import { useAuth } from '@/hooks/auth/useAuth';
import { withRole } from '@/components/auth/withRole';
import { formatCurrency } from '@/lib/utils';

import type { NextPage } from 'next';

type DiscoverArtist = {
  id: string;
  artistId?: string;
  artist_id?: string;
  name: string;
  city: string;
  genres?: string[];
  basePrice: number;
  currency: string;
  isNegotiable: boolean;
};

type RawDiscoverArtist = Partial<DiscoverArtist> & {
  id?: string;
  artistId?: string;
  artist_id?: string;
};

const ManagerDiscoverArtistsPage: NextPage = () => {
  const [artists, setArtists] = useState<DiscoverArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [city, setCity] = useState('');
  const [genre, setGenre] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const loadArtists = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = user?.token || '';
      const data = await discoverArtists(token, {
        city,
        genre,
        date: date || new Date().toISOString(),
        minPrice,
        maxPrice,
        search: searchTerm || undefined,
      });
      const normalized: DiscoverArtist[] = ((data ?? []) as RawDiscoverArtist[])
        .map((a) => {
          const id = a.id || a.artistId || a.artist_id;
          if (!id || !a.name) return null;
          return {
            id,
            name: a.name,
            city: a.city ?? '',
            genres: Array.isArray(a.genres) ? a.genres : [],
            basePrice: typeof a.basePrice === 'number' ? a.basePrice : 0,
            currency: a.currency ?? 'EUR',
            isNegotiable: Boolean(a.isNegotiable),
          };
        })
        .filter((a): a is DiscoverArtist => a !== null);
      setArtists(normalized);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los artistas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredArtists = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return artists;
    return artists.filter((a) => a.name.toLowerCase().includes(term));
  }, [artists, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="relative w-full overflow-hidden bg-fintech-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-0.5">Discover</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Buscar artistas para representar</h1>
            </div>
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60">
              <Filter className="h-4 w-4" />
              Filtros
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Nombre</span>
                <div className="relative">
                  <Search className="h-4 w-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 pl-9 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                    placeholder="Nombre artístico"
                  />
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Ciudad</span>
                <div className="relative">
                  <MapPin className="h-4 w-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 pl-9 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                    placeholder="Madrid"
                  />
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Género</span>
                <div className="relative">
                  <Music className="h-4 w-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 pl-9 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                    placeholder="Techno"
                  />
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Fecha</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                />
              </label>

              <div className="md:col-span-1">
                <button
                  type="button"
                  onClick={loadArtists}
                  className="inline-flex items-center justify-center rounded-xl bg-amber-500 text-amber-950 px-4 py-2.5 text-sm font-black uppercase tracking-widest hover:bg-amber-400 w-full"
                >
                  Aplicar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Caché mínimo (€)</span>
                <input
                  type="number"
                  value={minPrice ?? ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMinPrice(Number.isFinite(val) ? val : undefined);
                  }}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                  placeholder="500"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Caché máximo (€)</span>
                <input
                  type="number"
                  value={maxPrice ?? ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxPrice(Number.isFinite(val) ? val : undefined);
                  }}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                  placeholder="2000"
                />
              </label>
            </div>
          </section>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando artistas...
          </div>
        )}

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {!loading && filteredArtists.length === 0 && !error && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No se encontraron artistas con los filtros seleccionados.
          </div>
        )}

        {!loading && filteredArtists.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Resultado</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{filteredArtists.length} artistas</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArtists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artists/profile/${artist.id}`}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:border-amber-200 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-lg font-black text-slate-900">{artist.name}</p>
                      <p className="text-sm text-slate-600 flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {artist.city || 'Sin ciudad'}
                      </p>
                      {artist.genres && artist.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {artist.genres.map((g) => (
                            <span key={g} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-base font-black text-slate-900">{formatCurrency(artist.basePrice, artist.currency)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Caché base</p>
                      <p className="text-[11px] text-slate-500">{artist.isNegotiable ? 'Negociable' : 'No negociable'}</p>
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-amber-700 transition-colors">
                    Ver perfil
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default withRole(ManagerDiscoverArtistsPage, ['MANAGER']);
