import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { createBooking } from '@/services/bookings/bookings.service';
import { getArtists } from '@/services/artists/artists.service';

export default function NewBookingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [artists, setArtists] = useState<any[]>([]);
  const [artistId, setArtistId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState(
    `Esta propuesta define las condiciones iniciales de la contratación.

El contenido y el importe quedarán registrados en ARTIME como base de la negociación.`
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gate por rol
  useEffect(() => {
    if (!user) return;

    if (!['VENUE', 'PROMOTER'].includes(user.role)) {
      router.replace('/');
    }
  }, [user, router]);

  // Carga de artistas
  useEffect(() => {
    if (!user?.token) return;

    getArtists(user.token)
      .then(setArtists)
      .catch(() => {
        setError('No se pudieron cargar los artistas');
      });
  }, [user?.token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.token) return;

    try {
      setSubmitting(true);
      setError(null);

      const booking = await createBooking(
        {
          artistId,
          start_date: startDate,
          totalAmount: Number(amount),
          currency: 'EUR',
          message,
        },
        user.token
      );

      router.push(`/bookings/${booking.id}`);
    } catch {
      setError('No se pudo crear la propuesta');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return <p style={{ padding: 24 }}>Cargando…</p>;
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      {/* HEADER */}
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>
          Nueva propuesta de contratación
        </h1>
        <p style={{ color: '#555', maxWidth: 560 }}>
          Esta acción inicia una negociación profesional.
          Las condiciones y el mensaje quedarán registrados
          como base contractual.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        {/* 1️⃣ CONDICIONES CONTRACTUALES */}
        <section
          style={{
            border: '1px solid #ddd',
            padding: 16,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>
            Condiciones iniciales
          </h2>

          <label style={{ display: 'block', marginBottom: 12 }}>
            Artista
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              required
              style={{ width: '100%', marginTop: 4 }}
            >
              <option value="">Selecciona un artista</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'block', marginBottom: 12 }}>
            Fecha de la actuación
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>

          <label style={{ display: 'block' }}>
            Importe total (€)
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </section>

        {/* 2️⃣ MENSAJE DE NEGOCIACIÓN */}
        <section style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Mensaje inicial (opcional)
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              padding: 8,
              marginBottom: 8,
            }}
          />

          <p style={{ color: '#666', fontSize: 14 }}>
            Este mensaje queda registrado y da inicio a la negociación.
            No sustituye a las condiciones indicadas.
          </p>
        </section>

        {/* ERROR */}
        {error && (
          <p style={{ color: 'red', marginBottom: 16 }}>
            {error}
          </p>
        )}

        {/* CONFIRMACIÓN IMPLÍCITA */}
        <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
          Al enviar esta propuesta se crea un booking en estado inicial,
          visible para ambas partes.
        </p>

        {/* CTA */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#000',
            color: '#fff',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting
            ? 'Creando propuesta…'
            : 'Crear propuesta de contratación'}
        </button>
      </form>
    </main>
  );
}
