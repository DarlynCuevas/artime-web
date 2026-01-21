import { useEffect, useState } from 'react';
import Link from 'next/link';
import { discoverVenues } from '@/services/venues/discoverVenues.service';

type DiscoverVenue = {
  id: string;
  name: string;
  city: string;
  genres?: string[];
};

export default function ArtistDiscoverVenuesPage() {
  const [venues, setVenues] = useState<DiscoverVenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setVenues(data);
    } catch {
      setError('No se pudieron cargar las salas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
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
        <h1>Salas disponibles</h1>
        <p style={{ color: '#555', maxWidth: 600 }}>
          Consulta salas y espacios donde puedes recibir
          propuestas de contratación.
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
            Género habitual
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>

          <button type="button" onClick={loadVenues}>
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
      {loading && <p>Cargando salas…</p>}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && venues.length === 0 && (
        <p style={{ color: '#666' }}>
          No se encontraron salas que cumplan los criterios
          actuales.
        </p>
      )}

      {/* RESULTADOS */}
      {!loading && venues.length > 0 && (
        <section>
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>
            Resultados
          </h2>

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {venues.map((venue) => (
              <li
                key={venue.id}
                style={{
                  border: '1px solid #ddd',
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <strong>{venue.name}</strong>

                <div style={{ color: '#555', marginTop: 4 }}>
                  {venue.city}
                  {venue.genres?.length
                    ? ` · ${venue.genres.join(', ')}`
                    : ''}
                </div>

                <p
                  style={{
                    color: '#666',
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  Esta sala puede enviar propuestas de
                  contratación a través de ARTIME.
                </p>

                <div style={{ marginTop: 12 }}>
                  <Link href={`/venue/${venue.id}`}>
                    Consultar perfil de la sala
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
