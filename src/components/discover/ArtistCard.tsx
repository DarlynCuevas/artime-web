import { DiscoverArtist } from '@/types/artists/discover-artist';
import Link from 'next/link';

export function ArtistCard({ artist }: { artist: DiscoverArtist }) {
  return (
    <Link
      href={`/artists/${artist.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          border: '1px solid #ddd',
          padding: 16,
          cursor: 'pointer',
        }}
      >
        <h3 style={{ marginBottom: 4 }}>{artist.name}</h3>

        <p style={{ color: '#666', fontSize: 14 }}>
          {artist.city} · {artist.genres.join(', ')}
        </p>

        <p style={{ marginTop: 8 }}>
          Desde {artist.basePrice} {artist.currency}
        </p>

        {artist.rating && (
          <p style={{ fontSize: 13, color: '#777' }}>
            Valoración: {artist.rating}
          </p>
        )}
      </div>
    </Link>
  );
}
