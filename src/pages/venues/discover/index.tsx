import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Coins, Filter, MapPin, Music, Search, Sparkles, X, Zap } from 'lucide-react';

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
  const [showFilters, setShowFilters] = useState(false);

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
        .map((a: any) => ({ ...a, id: a.id || a.artistId || a.artist_id }))
        .filter((a: any) => Boolean(a.id));
      setArtists(normalized);
    } catch {
      setError('No se pudieron cargar los artistas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArtists(); }, []);

  const handleNotify = useCallback(async () => {
    if (!user?.token) { setCallError('Debes iniciar sesión para notificar.'); return; }
    if (!date) { setCallError('Indica la fecha del evento.'); return; }
    if (maxPrice === undefined || Number.isNaN(maxPrice)) { setCallError('Indica un precio máximo válido.'); return; }

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
        { date, city: trimmedCity || undefined, filters: Object.keys(filters).length ? filters : undefined },
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

  const hasActiveFilters = Boolean(city || genre || date || minPrice !== undefined || maxPrice !== undefined);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-fintech-dark rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-12">
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-0.5">Catálogo</p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Descubrir artistas</h1>
              </div>
            </div>
            <p className="text-white/50 text-sm max-w-xl ml-16">
              Consulta artistas con condiciones base visibles para iniciar una contratación formal.
            </p>
          </div>

          {/* Barra de búsqueda principal */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadArtists()}
                placeholder="Buscar artista por nombre…"
                className="w-full rounded-2xl bg-white/8 border border-white/10 text-white placeholder-white/30 px-4 py-3.5 pl-11 text-sm font-medium focus:outline-none focus:border-amber-400/50 focus:bg-white/12 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all duration-200 ${showFilters || hasActiveFilters
                ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filtros
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
            <button
              type="button"
              onClick={loadArtists}
              disabled={loading}
              className="px-5 py-3.5 rounded-2xl bg-brand-amber text-amber-950 font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all duration-200 disabled:opacity-50 shrink-0"
            >
              {loading ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">

        {/* Panel de filtros expandible */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Filtros avanzados</h2>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => { setCity(''); setGenre(''); setDate(''); setMinPrice(undefined); setMaxPrice(undefined); }}
                  className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Limpiar
                </button>
              )}
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FilterInput
                label="Ciudad"
                icon={<MapPin className="w-3.5 h-3.5" />}
                value={city}
                onChange={setCity}
                placeholder="Ej. Madrid"
              />
              <FilterInput
                label="Género"
                icon={<Music className="w-3.5 h-3.5" />}
                value={genre}
                onChange={setGenre}
                placeholder="Ej. Rock"
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Fecha del evento
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" /> Caché mínimo (€)
                </label>
                <input
                  type="number"
                  value={minPrice ?? ''}
                  onChange={(e) => setMinPrice(e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="Ej. 500"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" /> Caché máximo (€)
                </label>
                <input
                  type="number"
                  value={maxPrice ?? ''}
                  onChange={(e) => setMaxPrice(e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="Ej. 2000"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Notificar artistas */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900">Notificar a artistas compatibles</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Requiere fecha y precio máximo. Usa los filtros activos.</p>
                </div>
                <button
                  type="button"
                  disabled={callLoading || !user?.token || !date || maxPrice === undefined || Number.isNaN(maxPrice)}
                  onClick={handleNotify}
                  className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 text-amber-950 font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {callLoading ? 'Notificando…' : 'Notificar artistas'}
                </button>
              </div>
              {callMessage && <p className="mt-3 text-xs font-bold text-emerald-600">{callMessage}</p>}
              {callError && <p className="mt-3 text-xs font-bold text-red-600">{callError}</p>}
            </div>
          </div>
        )}

        {/* Resultados */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Buscando artistas…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-sm text-red-500 font-medium">{error}</div>
        )}

        {!loading && !error && filteredArtists.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <p className="font-black text-slate-900 text-sm">Sin resultados</p>
            <p className="text-xs text-slate-400 mt-1">No se encontraron artistas con los filtros seleccionados.</p>
          </div>
        )}

        {!loading && filteredArtists.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Resultados</h2>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{filteredArtists.length} artista{filteredArtists.length !== 1 ? 's' : ''} disponible{filteredArtists.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {filteredArtists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artists/profile/${artist.id}`}
                  className="group flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 shrink-0 overflow-hidden flex items-center justify-center text-amber-600 font-black text-sm group-hover:bg-amber-500/20 transition-colors">
                    {artist.profileImageUrl ? (
                      <img src={artist.profileImageUrl} alt={`Foto de ${artist.name}`} className="w-full h-full object-cover" />
                    ) : (
                      <span>{artist.name?.slice(0, 1)?.toUpperCase() ?? '?'}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{artist.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {artist.city}
                      </span>
                      {artist.genres?.length ? (
                        <span className="flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {artist.genres.slice(0, 3).join(' · ')}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Precio */}
                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-900 tabular-nums">{formatCurrency(artist.basePrice, artist.currency)}</p>
                    <p className={`text-[10px] font-bold ${artist.isNegotiable ? 'text-amber-500' : 'text-slate-400'}`}>
                      {artist.isNegotiable ? 'Negociable' : 'Fijo'}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-amber-300 group-hover:bg-amber-50 transition-all">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────
function FilterInput({ label, icon, value, onChange, placeholder }: {
  label: string; icon: React.ReactNode; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
        {icon} {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}
