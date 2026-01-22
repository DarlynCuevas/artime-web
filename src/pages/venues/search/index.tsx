import { ArtistCard } from '@/components/artists/ArtistCard';
import { useDiscoverArtists } from '@/hooks/artists/useDiscoverArtists';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { createArtistCall } from '@/services/venues/artist-calls.service';

export default function VenueDiscoverPage() {
  const [date, setDate] = useState('');
  const [city, setCity] = useState('');
  const [genre, setGenre] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const router = useRouter()
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const [callLoading, setCallLoading] = useState(false);
  const [callMessage, setCallMessage] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const { artists, loading } = useDiscoverArtists({
    date,
    city,
    genre,
    minPrice,
    maxPrice,
    search: search || undefined,
  });
  return (
    <main
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      {/* HEADER */}
      <header style={{ marginBottom: 32 }}>
        <h1>Buscar artistas</h1>
        <p style={{ color: '#555', maxWidth: 600 }}>
          Selecciona artistas disponibles para iniciar una
          propuesta de contratación.
        </p>
      </header>

      {/* FILTROS */}
      <section
        style={{
          border: '1px solid #ddd',
          padding: 16,
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 16 }}>
          Criterios de búsqueda
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <label>
            Fecha de la actuación
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>

          <label>
            Ciudad
            <input
              placeholder="Ciudad"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>

          <label>
            Género
            <input
              placeholder="Género"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>

          <label>
            Precio mínimo (€)
            <input
              type="number"
              onChange={(e) =>
                setMinPrice(
                  Number(e.target.value) || undefined
                )
              }
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>

          <label>
            Precio máximo (€)
            <input
              type="number"
              onChange={(e) =>
                setMaxPrice(
                  Number(e.target.value) || undefined
                )
              }
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        <p style={{ color: '#666', fontSize: 13 }}>
          Los resultados se actualizan según los criterios
          seleccionados.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <button
            type="button"
            disabled={callLoading || !user?.token || !date || !city}
            onClick={async () => {
              if (!user?.token) {
                setCallError('Debes iniciar sesión para notificar.');
                return;
              }
              if (!date || !city) {
                setCallError('Indica fecha y ciudad para notificar.');
                return;
              }
              setCallLoading(true);
              setCallError(null);
              setCallMessage(null);
              try {
                const res = await createArtistCall(
                  {
                    date,
                    city,
                    filters: {
                      genre: genre || undefined,
                      minPrice,
                      maxPrice,
                      search: search || undefined,
                    },
                  },
                  user.token,
                );
                setCallMessage(`Convocatoria creada. Artistas notificados: ${res.notifiedArtists ?? res.notified ?? 0}`);
              } catch (err: any) {
                setCallError(err?.message || 'No se pudo notificar a los artistas');
              } finally {
                setCallLoading(false);
              }
            }}
            style={{
              padding: '10px 14px',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: callLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {callLoading ? 'Notificando…' : 'Notificar artistas'}
          </button>
          <span style={{ fontSize: 12, color: '#555' }}>
            Requiere fecha y ciudad. Usa los filtros actuales.
          </span>
        </div>

        {callMessage && <p style={{ color: 'green', marginTop: 8 }}>{callMessage}</p>}
        {callError && <p style={{ color: 'red', marginTop: 8 }}>{callError}</p>}
      </section>

      {/* RESULTADOS */}
      <section>
        <h2 style={{ fontSize: 16, marginBottom: 16 }}>
          Resultados
        </h2>

        {loading && <p>Cargando resultados…</p>}

        {!loading && artists.length === 0 && (
          <p style={{ color: '#666' }}>
            No se encontraron artistas que cumplan los
            criterios actuales.
          </p>
        )}

        {!loading &&
          artists.map((a) => (
            <ArtistCard
              key={a.artistId}
              artist={a}
              onViewProfile={(id) =>
                router.push(`/artists/${id}?date=${date}`)
              }
            />
          ))}

      </section>
    </main>
  );
}
