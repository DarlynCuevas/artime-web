import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter, Search, MapPin, Music, ArrowRight, Users } from 'lucide-react';

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
      const normalized = (data ?? [])
        .map((a: any) => ({
          ...a,
          id: a.id || a.artistId || a.artist_id,
        }))
        .filter((a: any) => Boolean(a.id));
      setArtists(normalized);
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar los artistas');
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
    <main className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Explorar artistas</p>
        <h1 className="text-3xl font-semibold text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-slate-600" /> Busca artistas para representar
        </h1>
        <p className="text-slate-600 max-w-3xl">
          Visualiza perfiles públicos, caché base y disponibilidad estimada. El backend define si puedes solicitar representación.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-900">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-600">Buscar por nombre</span>
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="Ej. Nombre del artista"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-600">Ciudad</span>
            <div className="relative">
              <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="Ej. Madrid"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-600">Género</span>
            <div className="relative">
              <Music className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="Ej. Rock"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-600">Fecha</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-600">Precio mínimo (€)</span>
            <input
              type="number"
              value={minPrice ?? ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinPrice(Number.isFinite(val) ? val : undefined);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="Ej. 500"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-600">Precio máximo (€)</span>
            <input
              type="number"
              value={maxPrice ?? ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxPrice(Number.isFinite(val) ? val : undefined);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="Ej. 2000"
            />
          </label>

          <div className="flex gap-2 md:col-span-1">
            <button
              type="button"
              onClick={loadArtists}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 w-full"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </section>

      {loading && <p className="text-sm text-slate-600">Cargando artistas…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && filteredArtists.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">
          No se encontraron artistas con los filtros seleccionados.
        </div>
      )}

      {!loading && filteredArtists.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Artistas</h2>
            <span className="text-sm text-slate-500">{filteredArtists.length} encontrados</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArtists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/profile/${artist.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-900 group-hover:text-slate-950">{artist.name}</p>
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {artist.city || '—'}
                    </p>
                    {artist.genres && artist.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        {artist.genres.map((g) => (
                          <span key={g} className="rounded-full bg-slate-100 px-2 py-1">{g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-base font-semibold text-slate-900">{formatCurrency(artist.basePrice, artist.currency)}</p>
                    <p className="text-xs text-slate-500">Caché base</p>
                    <p className="text-[11px] text-slate-500">{artist.isNegotiable ? 'Negociable' : 'No negociable'}</p>
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                  Ver perfil <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default withRole(ManagerDiscoverArtistsPage, ['MANAGER']);
