import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { discoverArtists } from '@/services/artists/discoverArtists.service';
import { useAuth } from '@/hooks/auth/useAuth';

type DiscoverArtist = {
  id: string;
  name: string;
  city: string;
  genres?: string[];
  basePrice: number;
  currency: string;
  isNegotiable: boolean;
};

export default function VenueDiscoverArtistsPage() {
  const router = useRouter();

  const [artists, setArtists] = useState<DiscoverArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const {user} = useAuth();
  const [city, setCity] = useState('');
  const [genre, setGenre] = useState('');

  const loadArtists = async () => {
    setLoading(true);
    setError(null);
    try {
      let token = user?.token || '';
      const data = await discoverArtists(token, {
        city,
        genre,
        date: new Date().toISOString(), // Puedes ajustar la fecha si es necesario
      });
      setArtists(data);
    } catch {
      setError('No se pudieron cargar los artistas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      {/* HEADER */}
      <header style={{ marginBottom: 32 }}>
        <h1>Artistas disponibles</h1>
        <p style={{ color: '#555', maxWidth: 600 }}>
          Consulta artistas con condiciones base visibles para
          iniciar una contratación formal.
        </p>
      </header>

      {/* FILTROS */}
      <section
        style={{
          border: '1px solid #ddd',
          padding: 20,
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 16 }}>
          Criterios de búsqueda
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <label>
            Ciudad
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>

          <label>
            Género
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>

          <button type="button" onClick={loadArtists}>
            Aplicar filtros
          </button>
        </div>

        <p
          style={{
            color: '#666',
            fontSize: 13,
            marginTop: 12,
          }}
        >
          Los resultados se actualizan según los criterios
          seleccionados.
        </p>
      </section>

      {/* ESTADOS */}
      {loading && <p>Cargando artistas…</p>}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && artists.length === 0 && (
        <p style={{ color: '#666' }}>
          No se encontraron artistas que cumplan los criterios
          actuales.
        </p>
      )}

      {/* RESULTADOS */}
      {!loading && artists.length > 0 && (
        <section>
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>
            Resultados
          </h2>

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {artists.map((artist) => (
              <li
                key={artist.id}
                style={{
                  border: '1px solid #ddd',
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <strong>{artist.name}</strong>

                <div style={{ color: '#555', marginTop: 4 }}>
                  {artist.city}
                  {artist.genres?.length
                    ? ` · ${artist.genres.join(', ')}`
                    : ''}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                  }}
                >
                  Condición económica base:{' '}
                  <strong>
                    {artist.basePrice} {artist.currency}
                  </strong>{' '}
                  ·{' '}
                  {artist.isNegotiable
                    ? 'Condición negociable'
                    : 'Condición no negociable'}
                </div>

                <p
                  style={{
                    color: '#666',
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  Las condiciones finales se definen mediante un
                  booking en ARTIME.
                </p>

                <div style={{ marginTop: 12 }}>
                  <Link href={`/artists/${artist.artistId}`}>
                    Consultar perfil del artista
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
