import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { Event } from '@/types/event';
import { eventsService } from '@/services/events/events.service';
import { useAuth } from '@/hooks/auth/useAuth';
import { useEventBookings } from '@/hooks/events/useEventBookings';
import { useArtists } from '@/hooks/artists/useArtists';
import { useEventInvitations } from '@/hooks/events/useEventInvitations';

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllAccepted, setShowAllAccepted] = useState(false);

  const {
    bookings: eventBookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useEventBookings(event?.id);

  const { artists, artistsLoading, artistsError } = useArtists();

  const { invitations, loading: invitationsLoading } =
    useEventInvitations(event?.id);

  const canSearchArtists =
    event?.status === 'DRAFT' || event?.status === 'SEARCHING';
  const eventDateForQuery = event?.start_date
    ? new Date(event.start_date).toISOString().slice(0, 10)
    : '';

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

  const handleSearchArtists = async () => {
    if (!event || !user?.token) return;

    if (event.status !== 'SEARCHING') {
      await eventsService.startSearch(event.id, user.token);
    }

    router.push(`/events/${event.id}/search-artists`);
  };

  const handleDuplicateEvent = async () => {
    if (!event || !user?.token) return;
    const duplicated = await eventsService.duplicateEvent(event.id, user.token);
    router.push(`/events/${duplicated.id}`);
  };

  const handleCreateBooking = (artistId: string) => {
    if (!event) return;
    const date = event.start_date
      ? new Date(event.start_date).toISOString().slice(0, 10)
      : '';
    const query = new URLSearchParams();
    query.set('artistId', artistId);
    query.set('eventId', event.id);
    if (date) query.set('date', date);
    router.push(`/bookings/new?${query.toString()}`);
  };

  const artistNameById = (artistId: string) => {
    const artist = artists.find((a) => a.id === artistId);
    return artist?.name ?? 'Artista';
  };

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === 'PENDING' || inv.status === 'SENT',
  );
  const acceptedInvitations = invitations.filter(
    (inv) => inv.status === 'ACCEPTED' || inv.status === 'INTERESTED',
  );
  const declinedInvitations = invitations.filter(
    (inv) => inv.status === 'DECLINED',
  );
  const rejectedBookingArtists = eventBookings
    .filter((booking) =>
      ['CANCELLED', 'REJECTED'].includes(booking.status),
    )
    .map((booking) => ({
      artistId: (booking as any).artistId ?? booking.artist?.id ?? '',
      name: booking.artist?.name ?? null,
    }))
    .filter((item) => item.artistId);

  const rejectedArtistIds = new Set(
    rejectedBookingArtists.map((item) => item.artistId),
  );

  const contractSignedArtistIds = new Set(
    eventBookings
      .filter((booking) => booking.status === 'CONTRACT_SIGNED')
      .map((booking) => (booking as any).artistId ?? booking.artist?.id ?? '')
      .filter(Boolean),
  );

  const acceptedInvitationsFiltered = acceptedInvitations.filter(
    (inv) =>
      !rejectedArtistIds.has(inv.artistId) &&
      !contractSignedArtistIds.has(inv.artistId),
  );

  const bookingByArtistId = new Map(
    eventBookings
      .map((booking) => ({
        artistId: (booking as any).artistId ?? booking.artist?.id ?? '',
        bookingId: booking.id,
        status: booking.status,
      }))
      .filter((item) => item.artistId),
  );

  const rejectedItems = [
    ...declinedInvitations.map((inv) => ({
      artistId: inv.artistId,
      name: artistNameById(inv.artistId),
    })),
    ...rejectedBookingArtists.map((item) => ({
      artistId: item.artistId,
      name: item.name ?? artistNameById(item.artistId),
    })),
  ];

  const seenRejected = new Set<string>();
  const uniqueRejectedItems = rejectedItems.filter((item) => {
    if (!item.artistId || seenRejected.has(item.artistId)) return false;
    seenRejected.add(item.artistId);
    return true;
  });

  const visibleAcceptedInvitations = showAllAccepted
    ? acceptedInvitationsFiltered
    : acceptedInvitationsFiltered.slice(0, 5);

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

      {/* ESTADO Y PRESUPUESTO */}
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
        <p style={{ marginTop: 8 }}>
          <strong>Estado:</strong> {event.status}
        </p>
        <p style={{ marginTop: 8 }}>
          <strong>Presupuesto estimado:</strong>{' '}
          {event.estimatedBudget ?? '—'}
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

        <button
          onClick={handleDuplicateEvent}
          style={{
            marginTop: 8,
            marginLeft: 8,
            padding: '6px 10px',
            border: '1px solid #000',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Duplicar evento
        </button>
      </section>

      {/* CTA: BUSCAR ARTISTAS */}
      {canSearchArtists && (
        <section
          style={{
            border: '1px solid #ddd',
            padding: 16,
            marginBottom: 32,
            background: '#f5f7ff',
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>
            Buscar artistas para este evento
          </h2>
          <p style={{ color: '#555', marginBottom: 12 }}>
            Filtra artistas disponibles y envía invitaciones al evento.
          </p>
          <button
            onClick={handleSearchArtists}
            style={{
              padding: '8px 12px',
              background: '#000',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Buscar artistas para este evento
          </button>
        </section>
      )}

      {/* ARTISTAS INVITADOS */}
      <section style={{ marginBottom: 32 }} id="event-invitations">
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>
          Artistas invitados
        </h2>

        {invitationsLoading && <p>Cargando invitaciones…</p>}

        {!invitationsLoading && invitations.length === 0 && (
          <p>No hay invitaciones todavía.</p>
        )}

        {!invitationsLoading && invitations.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            <div style={{ border: '1px solid #ddd', padding: 12 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>
                Pendientes
              </h3>
              {pendingInvitations.length === 0 ? (
                <p style={{ color: '#666', fontSize: 13 }}>
                  Sin pendientes
                </p>
              ) : (
                pendingInvitations.map((inv) => (
                  <div key={inv.invitationId}>
                    {artistNameById(inv.artistId)}
                  </div>
                ))
              )}
            </div>

            <div style={{ border: '1px solid #ddd', padding: 12 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>
                Aceptados
              </h3>
              {acceptedInvitationsFiltered.length === 0 ? (
                <p style={{ color: '#666', fontSize: 13 }}>
                  Sin aceptados
                </p>
              ) : (
                visibleAcceptedInvitations.map((inv) => (
                  <div
                    key={inv.invitationId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span>{artistNameById(inv.artistId)}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {bookingByArtistId.has(inv.artistId) ? (
                        <>
                          <span style={{ fontSize: 12, color: '#333' }}>
                            Booking {bookingByArtistId.get(inv.artistId)?.status}
                          </span>
                          <a
                            href={`/bookings/${bookingByArtistId.get(inv.artistId)?.bookingId}`}
                            style={{ fontSize: 12, border: '1px solid #ddd', padding: '4px 8px' }}
                          >
                            Ver booking
                          </a>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCreateBooking(inv.artistId)}
                          style={{
                            fontSize: 12,
                            border: '1px solid #000',
                            padding: '4px 8px',
                            background: '#000',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          Crear booking
                        </button>
                      )}
                      <a
                        href={`/artists/profile/${inv.artistId}?eventId=${event?.id ?? ''}&date=${eventDateForQuery}`}
                        style={{ fontSize: 12, border: '1px solid #ddd', padding: '4px 8px' }}
                      >
                        Ver perfil
                      </a>
                    </div>
                  </div>
                ))
              )}
              {acceptedInvitationsFiltered.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllAccepted((s) => !s)}
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    border: '1px solid #ddd',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    background: '#fff',
                  }}
                >
                  {showAllAccepted ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </div>

            <div style={{ border: '1px solid #ddd', padding: 12 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>
                Rechazados
              </h3>
              {uniqueRejectedItems.length === 0 ? (
                <p style={{ color: '#666', fontSize: 13 }}>
                  Sin rechazados
                </p>
              ) : (
                uniqueRejectedItems.map((item) => (
                  <div key={item.artistId}>
                    {item.name}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      {/* LINE-UP (CONTRATACIONES DEL EVENTO) */}
      <section>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>
          Line-up del evento
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
