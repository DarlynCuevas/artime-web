import { ArtistCard } from '@/components/artists/ArtistCard';
import { useDiscoverArtists } from '@/hooks/artists/useDiscoverArtists';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function VenueDiscoverPage() {
  const [date, setDate] = useState('');
  const [city, setCity] = useState('');
  const [genre, setGenre] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const router = useRouter()
  const [search, setSearch] = useState('');

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
