import { useAuth } from '@/hooks/useAuth';
import { useArtistAvailability } from '@/hooks/artists/useArtistAvailability';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type ArtistProfile = {
  id: string;
  name: string;
  city: string;
  genres: string[];
  bio?: string;
  format?: string;
  basePrice: number;
  currency: string;
  isNegotiable: boolean;
  managerId?: string;
};

type DayStatus = 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE';

export default function ArtistProfilePage() {
  const router = useRouter();
  const { id, date } = router.query as { id: string; date?: string };
  const { user } = useAuth();

  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<Date>(new Date());

  const { days: availability, loading: availabilityLoading } =
  useArtistAvailability(id, month, user?.token);
  useEffect(() => {
    if (!id || !user?.token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/${id}`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((r) => r.json())
      .then(setArtist)
      .finally(() => setLoading(false));
  }, [id, user?.token]);

  if (loading) {
    return <p style={{ padding: 24 }}>Cargando artista…</p>;
  }

  if (!artist) {
    return <p style={{ padding: 24 }}>Artista no encontrado</p>;
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      {/* HEADER */}
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ marginBottom: 8 }}>{artist.name}</h1>
        <p style={{ color: '#555' }}>
          {artist.city}
          {artist.genres?.length ? ` · ${artist.genres.join(', ')}` : ''}
        </p>
      </header>

      {/* CUERPO */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 32,
          alignItems: 'start',
        }}
      >
        {/* COLUMNA IZQUIERDA */}
        <div>
          {/* PERFIL PROFESIONAL */}
          <section
            style={{
              border: '1px solid #ddd',
              padding: 20,
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>
              Información profesional
            </h2>

            {artist.bio ? (
              <p>{artist.bio}</p>
            ) : (
              <p style={{ color: '#666' }}>
                No hay descripción profesional registrada.
              </p>
            )}

            <p
              style={{
                color: '#777',
                fontSize: 13,
                marginTop: 12,
              }}
            >
              La información de este perfil es descriptiva y no constituye un
              acuerdo contractual.
            </p>
          </section>

          {/* DISPONIBILIDAD */}
          <section
            style={{
              border: '1px solid #ddd',
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>
              Disponibilidad
            </h2>

            {availabilityLoading && (
              <p style={{ color: '#666', fontSize: 14 }}>
                Cargando disponibilidad…
              </p>
            )}

            {!availabilityLoading && availability.length === 0 && (
              <p style={{ color: '#666', fontSize: 14 }}>
                No hay información de disponibilidad para este mes.
              </p>
            )}

            {!availabilityLoading && availability.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                {availability.map((day) => (
                  <div
                    key={day.date}
                    onClick={() => {
                      if (day.status !== 'AVAILABLE') return;
                      router.push(
                        `/bookings/new?artistId=${artist.id}&date=${day.date}`,
                      );
                    }}
                    style={{
                      padding: 8,
                      textAlign: 'center',
                      fontSize: 12,
                      cursor:
                        day.status === 'AVAILABLE'
                          ? 'pointer'
                          : 'default',
                      background:
                        day.status === 'AVAILABLE'
                          ? '#e6f4ea'
                          : day.status === 'BOOKED'
                          ? '#ccc'
                          : '#eee',
                    }}
                  >
                    {day.date.slice(8, 10)}
                  </div>
                ))}
              </div>
            )}

            <p style={{ color: '#777', fontSize: 13 }}>
              La disponibilidad es orientativa.  
              La contratación solo se confirma mediante un booking en ARTIME.
            </p>
          </section>
        </div>

        {/* COLUMNA DERECHA */}
        <aside
          style={{
            border: '1px solid #ddd',
            padding: 20,
            background: '#fafafa',
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>
            Condiciones económicas base
          </h2>

          <p
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            {artist.basePrice} {artist.currency}
          </p>

          <p style={{ color: '#555', fontSize: 14 }}>
            {artist.isNegotiable
              ? 'Condición negociable'
              : 'Condición no negociable'}
          </p>

          <p
            style={{
              color: '#777',
              fontSize: 13,
              marginTop: 12,
            }}
          >
            Las condiciones finales de la contratación se definen
            exclusivamente dentro de ARTIME mediante un booking formal.
          </p>
        </aside>
      </section>

      {/* CTA */}
      <section
        style={{
          marginTop: 48,
          borderTop: '1px solid #ddd',
          paddingTop: 24,
        }}
      >
        <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
          Este perfil puede utilizarse como base para iniciar una propuesta de
          contratación.
        </p>

        <button
          type="button"
          onClick={() => {
            router.push(
              date
                ? `/bookings/new?artistId=${artist.id}&date=${date}`
                : `/bookings/new?artistId=${artist.id}`,
            );
          }}
        >
          Iniciar contratación
        </button>
      </section>
    </main>
  );
}
