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
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            overflow: 'hidden',
            background: '#f3f4f6',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontWeight: 600,
          }}
        >
          {artist.profileImageUrl ? (
            <img
              src={artist.profileImageUrl}
              alt={`Foto de ${artist.name}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>{artist.name?.slice(0, 1)?.toUpperCase() ?? '?'}</span>
          )}
        </div>

        <div>
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
      </div>
    </Link>
  );
}
