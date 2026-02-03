import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useArtistDashboard } from '@/hooks/artists/useArtistDashboard';
import {
  getMyArtistProfile,
  updateMyArtistProfile,
} from '@/services/artists/artists.service';

type ArtistProfile = {
  name: string;
  city: string;
  genres: string[];
  bio: string;
  format?: string;
  basePrice?: number;
  currency?: string;
  isNegotiable?: boolean;
  managerId?: string | null;
  rating?: number;
};

export default function ArtistProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { data: dashboard } = useArtistDashboard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const isOwner = Boolean(user?.token);

  const genresText = useMemo(
    () => (artist?.genres?.length ? artist.genres.join(', ') : ''),
    [artist?.genres],
  );

  const confirmedDates = useMemo(() => {
    const allowed = new Set(['CONTRACT_SIGNED', 'PAID_PARTIAL', 'PAID_FULL']);
    const upcoming = dashboard?.upcomingBookings ?? [];

    return upcoming
      .filter((b) => allowed.has(b.status))
      .filter((b) => Boolean(b.startDate))
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() -
          new Date(b.startDate).getTime(),
      );
  }, [dashboard?.upcomingBookings]);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      setArtist(null);
      return;
    }

    setLoading(true);
    setError(null);

    getMyArtistProfile(user.token)
      .then((data) => {
        setArtist(data);
      })
      .catch((err) => {
        setError(err?.message || 'No se pudo cargar el perfil');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.token]);

  async function handleSave() {
    if (!user?.token || !artist) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: artist.name,
        city: artist.city,
        genres: artist.genres,
        bio: artist.bio,
        basePrice: artist.basePrice,
        currency: artist.currency,
        isNegotiable: artist.isNegotiable,
      };
      const updated = await updateMyArtistProfile(payload, user.token);
      setArtist(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      {/* HEADER */}
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>
          Perfil del artista
        </h1>
        <p style={{ color: '#555', maxWidth: 600 }}>
          Gestiona tu identidad pÃºblica, disponibilidad y
          la informaciÃ³n que ven los venues.
        </p>
      </header>

      {authLoading || loading ? (
        <section style={{ color: '#666' }}>Cargando...</section>
      ) : null}

      {error ? (
        <section style={{ color: '#b00020', marginBottom: 16 }}>
          {error}
        </section>
      ) : null}

      {!artist && !loading ? (
        <section style={{ color: '#666' }}>
          No se encontrÃ³ un perfil de artista para este usuario.
        </section>
      ) : null}

      {/* RESUMEN PERFIL */}
      {artist ? (
        <section
        style={{
          border: '1px solid #ddd',
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 8,
          }}
        >
          <h2 style={{ fontSize: 22, margin: 0 }}>
            {artist.name}
          </h2>
          {isOwner ? (
            <button
              type="button"
              style={{
                border: '1px solid #ddd',
                background: '#fff',
                padding: '8px 12px',
                cursor: 'pointer',
              }}
              onClick={() => setIsEditing((prev) => !prev)}
            >
              {isEditing ? 'Cancelar' : 'Editar perfil'}
            </button>
          ) : null}
        </div>
        <p style={{ color: '#666', marginBottom: 8 }}>
          {artist.format || 'Formato no definido'} - {artist.city}
        </p>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
          Cache: {artist.basePrice ?? '--'} {artist.currency ?? ''} - {artist.isNegotiable ? 'Negociable' : 'No negociable'}
        </p>
        <p style={{ color: '#666', fontSize: 14 }}>
          {artist.bio}
        </p>
      </section>
      ) : null}

      {/* METRICAS */}
      {artist ? (
        <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}
      >
        <div style={{ border: '1px solid #ddd', padding: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>
            {artist.rating ?? '—'}
          </div>
          <div style={{ color: '#666', fontSize: 13 }}>
            Rating promedio
          </div>
        </div>
        <div style={{ border: '1px solid #ddd', padding: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>
            —
          </div>
          <div style={{ color: '#666', fontSize: 13 }}>
            Shows realizados
          </div>
        </div>
      </section>
      ) : null}

      {/* EDICION */}
      {artist && isEditing ? (
        <section
          style={{
            border: '1px solid #ddd',
            padding: 24,
            marginBottom: 40,
          }}
        >
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>
            Editar perfil
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#666' }}>
                Nombre
              </span>
              <input
                value={artist.name}
                onChange={(e) =>
                  setArtist({ ...artist, name: e.target.value })
                }
                style={{ padding: 10, border: '1px solid #ddd' }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#666' }}>
                Ciudad
              </span>
              <input
                value={artist.city}
                onChange={(e) =>
                  setArtist({ ...artist, city: e.target.value })
                }
                style={{ padding: 10, border: '1px solid #ddd' }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#666' }}>
                Cache base
              </span>
              <input
                type="number"
                value={artist.basePrice ?? ''}
                onChange={(e) =>
                  setArtist({
                    ...artist,
                    basePrice: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                style={{ padding: 10, border: '1px solid #ddd' }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#666' }}>
                Moneda
              </span>
              <input
                value={artist.currency ?? ''}
                onChange={(e) =>
                  setArtist({ ...artist, currency: e.target.value })
                }
                style={{ padding: 10, border: '1px solid #ddd' }}
              />
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={Boolean(artist.isNegotiable)}
                onChange={(e) =>
                  setArtist({ ...artist, isNegotiable: e.target.checked })
                }
              />
              <span style={{ fontSize: 13, color: '#666' }}>
                Cache negociable
              </span>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#666' }}>
                GÃ©neros (separados por coma)
              </span>
              <input
                value={genresText}
                onChange={(e) =>
                  setArtist({
                    ...artist,
                    genres: e.target.value
                      .split(',')
                      .map((g) => g.trim())
                      .filter(Boolean),
                  })
                }
                style={{ padding: 10, border: '1px solid #ddd' }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#666' }}>
                BiografÃ­a
              </span>
              <textarea
                value={artist.bio}
                onChange={(e) =>
                  setArtist({ ...artist, bio: e.target.value })
                }
                rows={4}
                style={{ padding: 10, border: '1px solid #ddd' }}
              />
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  border: '1px solid #ddd',
                  background: '#fff',
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* BIOGRAFIA */}
      {artist ? (
        <section style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>
            BiografÃ­a
          </h3>
          <p style={{ color: '#666', fontSize: 14 }}>
            {artist.bio}
          </p>
        </section>
      ) : null}

      {/* PROXIMAS FECHAS */}
      <section>
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>
          PrÃ³ximas fechas
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {confirmedDates.length === 0 ? (
            <div style={{ color: '#666' }}>
              Sin fechas prÃ³ximas por ahora.
            </div>
          ) : (
            confirmedDates.map((item) => (
              <div
                key={`${item.bookingId}-${item.startDate}`}
                style={{
                  border: '1px solid #ddd',
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {new Date(item.startDate).toLocaleDateString()}
                </div>
                <div style={{ color: '#666', fontSize: 14 }}>
                  {item.venueName}
                </div>
                <div style={{ color: '#666', fontSize: 12 }}>
                  Estado: {item.status}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
