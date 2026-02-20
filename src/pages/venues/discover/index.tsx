import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Filter, Search, MapPin, Music, ArrowRight } from 'lucide-react';

import { discoverArtists } from '@/services/artists/discoverArtists.service';
import { createArtistCall } from '@/services/venues/artist-calls.service';
import { useAuth } from '@/hooks/auth/useAuth';
import { formatCurrency } from '@/lib/utils';

type DiscoverArtist = {
  id: string;
  artistId?: string;
  artist_id?: string;
  profileImageUrl?: string | null;
  name: string;
  city: string;
  genres?: string[];
  basePrice: number;
  currency: string;
  isNegotiable: boolean;
};

export default function VenueDiscoverArtistsPage() {
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
  const [callLoading, setCallLoading] = useState(false);
  const [callMessage, setCallMessage] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const loadArtists = async () => {
    setLoading(true);
    setError(null);
    try {
      let token = user?.token || '';
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
    } catch {
      setError('No se pudieron cargar los artistas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const handleNotify = useCallback(async () => {
    if (!user?.token) {
      setCallError('Debes iniciar sesión para notificar.');
      return;
    }

    if (!date) {
      setCallError('Indica la fecha del evento.');
      return;
    }

    if (maxPrice === undefined || Number.isNaN(maxPrice)) {
      setCallError('Indica un precio máximo válido.');
      return;
    }

    const trimmedCity = city.trim();
    const trimmedGenre = genre.trim();
    const trimmedSearch = searchTerm.trim();
    const filters: Record<string, any> = {};

    if (trimmedGenre) filters.genre = trimmedGenre;
    if (minPrice !== undefined) filters.minPrice = minPrice;
    if (maxPrice !== undefined) filters.maxPrice = maxPrice;
    if (trimmedSearch) filters.search = trimmedSearch;

    setCallLoading(true);
    setCallError(null);
    setCallMessage(null);

    try {
      const res = await createArtistCall(
        {
          date,
          city: trimmedCity || undefined,
          filters: Object.keys(filters).length ? filters : undefined,
        },
        user.token,
      );

      setCallMessage(`Convocatoria creada. Artistas notificados: ${res.notifiedArtists ?? res.notified ?? 0}`);
    } catch (err: any) {
      setCallError(err?.message || 'No se pudo notificar a los artistas');
    } finally {
      setCallLoading(false);
    }
  }, [city, date, genre, maxPrice, minPrice, searchTerm, user?.token]);

  const filteredArtists = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return artists;
    return artists.filter((a) => a.name.toLowerCase().includes(term));
  }, [artists, searchTerm]);

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Artistas disponibles</p>
        <h1 className="text-3xl font-semibold text-slate-900">Evalúa artistas para contratación</h1>
        <p className="text-slate-600 max-w-3xl">Consulta artistas con condiciones base visibles para iniciar una contratación formal.</p>
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

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <button
            type="button"
            disabled={
              callLoading ||
              !user?.token ||
              !date ||
              maxPrice === undefined ||
              Number.isNaN(maxPrice)
            }
            onClick={handleNotify}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 w-full md:w-auto"
          >
            {callLoading ? 'Notificando…' : 'Notificar artistas'}
          </button>
          <span className="text-xs text-slate-600">
            Requiere fecha y precio máximo. Usa los filtros actuales.
          </span>
        </div>
        {callMessage && <p className="text-sm text-emerald-600">{callMessage}</p>}
        {callError && <p className="text-sm text-red-600">{callError}</p>}
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
            <span className="text-sm text-slate-600">{filteredArtists.length} artistas encontrados</span>
          </div>

          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
            {filteredArtists.map((artist, index) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center text-slate-500 font-semibold">
                  {artist.profileImageUrl ? (
                    <img
                      src={artist.profileImageUrl}
                      alt={`Foto de ${artist.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{artist.name?.slice(0, 1)?.toUpperCase() ?? '?'}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{artist.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {artist.city}
                    </span>
                    {artist.genres?.length ? (
                      <span>{artist.genres.join(', ')}</span>
                    ) : null}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-medium text-slate-900">
                    {formatCurrency(artist.basePrice, artist.currency)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {artist.isNegotiable ? 'Negociable' : 'No negociable'}
                  </p>
                </div>

                <span className="inline-flex items-center text-sm text-slate-500 group-hover:text-slate-900">
                  Consultar perfil
                  <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
