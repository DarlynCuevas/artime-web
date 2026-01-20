
import { ArtistCard } from '@/components/discover/ArtistCard';
import { DiscoverArtist } from '@/types/artists/discover-artist';
import { discoverArtists } from '@/services/artists/artists.service';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export default function DiscoverPage() {
  const { user } = useAuth();
  const [artists, setArtists] = useState<DiscoverArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    discoverArtists(user.token)
      .then((data) => {
        setArtists(data);
        setError(null);
      })
      .catch(() => {
        setError('No se pudieron cargar los artistas');
      })
      .finally(() => setLoading(false));
  }, [user?.token]);

  return (
    <main
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1>Discover artistas</h1>
        <p style={{ color: '#555', maxWidth: 600 }}>
          Explora artistas profesionales disponibles en ARTIME.
        </p>
      </header>

      {loading && <p>Cargando artistas...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 24,
        }}
      >
        {artists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </section>
    </main>
  );
}
