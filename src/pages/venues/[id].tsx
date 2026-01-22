import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getVenueById } from '@/services/venues/venues.service';
import { useAuth } from '@/hooks/auth/useAuth';

type VenueProfile = {
  id: string;
  name: string;
  city: string;
  description: string;
  capacity?: number;
  address?: string;
  genres?: string[];
  images?: string[];
};

export default function VenueProfilePage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const artistName = (router.query?.artistName as string) || null;
  const { user } = useAuth();

  const [venue, setVenue] = useState<VenueProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || !id) return;

    getVenueById(id)
      .then(setVenue)
      .finally(() => setLoading(false));
  }, [router.isReady, id]);

  if (loading) {
    return <p style={{ padding: 24 }}>Cargando sala…</p>;
  }

  if (!venue) {
    return <p style={{ padding: 24 }}>Sala no encontrada</p>;
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      {/* HEADER — IDENTIDAD */}
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ marginBottom: 8 }}>{venue.name}</h1>
        <p style={{ color: '#555' }}>{venue.city}</p>
        {artistName && (
          <p style={{ color: '#333', marginTop: 6, fontSize: 14 }}>
            Artista: {artistName}
          </p>
        )}
      </header>

      {/* CUERPO — DOS COLUMNAS */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 32,
          alignItems: 'start',
        }}
      >
        {/* COLUMNA IZQUIERDA — CONTEXTO */}
        <div>
          {/* INFORMACIÓN GENERAL */}
          <section
            style={{
              border: '1px solid #ddd',
              padding: 20,
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>
              Información de la sala
            </h2>

            <p>{venue.description}</p>

            <p
              style={{
                color: '#777',
                fontSize: 13,
                marginTop: 12,
              }}
            >
              Este perfil es informativo y no constituye una
              oferta ni un compromiso contractual.
            </p>
          </section>

          {/* (RESERVADO v1) IMÁGENES / CONTEXTO VISUAL */}
          {venue.images && venue.images.length > 0 && (
            <section
              style={{
                border: '1px solid #ddd',
                padding: 20,
              }}
            >
              <h2 style={{ fontSize: 16, marginBottom: 12 }}>
                Espacio
              </h2>

              <p style={{ color: '#666', fontSize: 14 }}>
                Imágenes del espacio disponibles para referencia
                contextual.
              </p>
            </section>
          )}
        </div>

        {/* COLUMNA DERECHA — DATOS OPERATIVOS */}
        <aside
          style={{
            border: '1px solid #ddd',
            padding: 20,
            background: '#fafafa',
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>
            Datos operativos
          </h2>

          {artistName && (
            <p style={{ marginBottom: 8 }}>
              Artista: {artistName}
            </p>
          )}

          {venue.capacity && (
            <p style={{ marginBottom: 8 }}>
              Capacidad aproximada: {venue.capacity} personas
            </p>
          )}

          {venue.address && (
            <p style={{ marginBottom: 8 }}>
              Dirección: {venue.address}
            </p>
          )}

          {venue.genres && venue.genres.length > 0 && (
            <p style={{ marginBottom: 8 }}>
              Programación habitual:{' '}
              {venue.genres.join(', ')}
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}
