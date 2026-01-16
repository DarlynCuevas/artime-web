import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { Event } from '@/types/event';
import { eventsService } from '@/services/events/events.service';
import { useAuth } from '@/hooks/useAuth';
import { useEventBookings } from '@/hooks/events/useEventBookings';
import { useArtists } from '@/hooks/artists/useArtists';
import { useCreateBooking } from '@/hooks/bookings/useCreateBooking';

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    bookings: eventBookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useEventBookings(event?.id);

  const { submit: createBooking, loading: creating } =
    useCreateBooking(user?.token);

  const { artists, artistsLoading, artistsError } = useArtists();

  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

  const canInitiateBooking =
    user?.role === 'VENUE' || user?.role === 'MANAGER';

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    if (!user?.token) return;

    eventsService
      .getEvent(id, user.token)
      .then(setEvent)
      .catch(() => setError('No se pudo cargar el evento.'))
      .finally(() => setLoading(false));
  }, [id, user?.token]);

  if (loading) return <p style={{ padding: 40 }}>Cargando evento…</p>;
  if (error) return <p style={{ padding: 40, color: 'red' }}>{error}</p>;
  if (!event) return <p>No se encontró el evento.</p>;

  const handleToggleVisibility = async () => {
    if (!user?.token) return;

    const nextVisibility =
      event.visibility === 'PRIVATE' ? 'VISIBLE' : 'PRIVATE';

    await eventsService.updateEventVisibility(
      event.id,
      nextVisibility,
      user.token
    );

    const updated = await eventsService.getEvent(event.id, user.token);
    setEvent(updated);
  };

  const handleCreateBooking = async () => {
    if (!selectedArtistId) return;

    const booking = await createBooking({
      eventId: event.id,
      artistId: selectedArtistId,
      start_date: event.start_date,
      currency: 'EUR',
      totalAmount: 1000,
    });

    router.push(`/bookings/${booking.id}`);
  };

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
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>
          {event.name}
        </h1>

        <p style={{ color: '#555' }}>
          {event.start_date
            ? new Date(event.start_date).toLocaleDateString()
            : 'Fecha por definir'}
        </p>
      </header>

      {/* ESTADO DEL EVENTO */}
      <section
        style={{
          border: '1px solid #ddd',
          padding: 16,
          marginBottom: 32,
          background: '#fafafa',
        }}
      >
        <p>
          <strong>Visibilidad:</strong> {event.visibility}
        </p>

        <button
          onClick={handleToggleVisibility}
          style={{
            marginTop: 8,
            padding: '6px 10px',
            border: '1px solid #000',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          {event.visibility === 'PRIVATE'
            ? 'Hacer evento visible'
            : 'Ocultar evento'}
        </button>
      </section>

      {/* INICIAR CONTRATACIÓN */}
      {canInitiateBooking && (
        <section
          style={{
            border: '1px solid #ddd',
            padding: 16,
            marginBottom: 32,
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>
            Iniciar contratación
          </h2>

          {artistsLoading && <p>Cargando artistas…</p>}
          {artistsError && (
            <p style={{ color: 'red' }}>
              No se pudieron cargar los artistas
            </p>
          )}

          {!artistsLoading && !artistsError && (
            <>
              <select
                value={selectedArtistId ?? ''}
                onChange={(e) =>
                  setSelectedArtistId(e.target.value || null)
                }
                style={{ width: '100%', marginBottom: 12 }}
              >
                <option value="">
                  Selecciona un artista
                </option>

                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleCreateBooking}
                disabled={!selectedArtistId || creating}
                style={{
                  padding: '8px 12px',
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {creating
                  ? 'Creando contratación…'
                  : 'Iniciar contratación'}
              </button>
            </>
          )}
        </section>
      )}

      {/* CONTRATACIONES DEL EVENTO */}
      <section>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>
          Contrataciones del evento
        </h2>

        {bookingsLoading && <p>Cargando contrataciones…</p>}
        {bookingsError && (
          <p style={{ color: 'red' }}>
            No se pudieron cargar las contrataciones
          </p>
        )}

        {!bookingsLoading &&
          !bookingsError &&
          eventBookings.length === 0 && (
            <p>No hay contrataciones asociadas.</p>
          )}

        {!bookingsLoading &&
          !bookingsError &&
          eventBookings.length > 0 && (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th align="left">Artista</th>
                  <th align="left">Fecha</th>
                  <th align="left">Estado</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {eventBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    style={{ borderTop: '1px solid #eee' }}
                  >
                    <td style={{ padding: '12px 0' }}>
                      {booking.artist?.name ??
                        'Artista desconocido'}
                    </td>

                    <td>
                      {booking.start_date
                        ? new Date(
                            booking.start_date,
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>{booking.status}</td>

                    <td align="right">
                      <a href={`/bookings/${booking.id}`}>
                        Ver contratación
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </section>
    </main>
  );
}
