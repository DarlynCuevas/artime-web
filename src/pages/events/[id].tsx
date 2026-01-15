// Página de detalle de evento — PASO 14 / A1
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
    const { submit: createBooking, loading: creating } = useCreateBooking(user?.token);
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

    if (loading) return <p>Cargando evento…</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!event) return <p>No se encontró el evento.</p>;
    const handleToggleVisibility = async () => {
        if (!event || !user?.token) return;

        const nextVisibility =
            event.visibility === 'PRIVATE' ? 'VISIBLE' : 'PRIVATE';

        try {
            await eventsService.updateEventVisibility(
                event.id,
                nextVisibility,
                user.token
            );

            // Refrescamos el evento
            const updatedEvent = await eventsService.getEvent(
                event.id,
                user.token
            );
            setEvent(updatedEvent);
        } catch {
            alert('No se pudo cambiar la visibilidad del evento');
        }
    };

    const handleCreateBooking = async () => {
        if (!event || !user) return;

        if (!selectedArtistId) {
            alert('Selecciona un artista antes de iniciar la contratación');
            return;
        }

        try {
            const booking = await createBooking({
                eventId: event.id,
                artistId: selectedArtistId,
                start_date: event.start_date,
                currency: 'EUR',
                totalAmount: 1000, // valor fijo por ahora
            });

            router.push(`/bookings/${booking.id}`);
        } catch {
            alert('No se pudo iniciar la contratación');
        }
    };


    return (
        <div>
            <h1>{event.name}</h1>

            <p>
                {event.start_date} — {event.endDate}
            </p>

            <p>
                Visibilidad: <strong>{event.visibility}</strong>
            </p>

            <button onClick={handleToggleVisibility}>
                {event.visibility === 'PRIVATE'
                    ? 'Hacer evento visible'
                    : 'Ocultar evento'}
            </button>

            <hr style={{ margin: '32px 0' }} />

            {canInitiateBooking && (
                <>
                    <hr style={{ margin: '32px 0' }} />

                    <h3>Iniciar contratación</h3>

                    {artistsLoading && <p>Cargando artistas…</p>}

                    {artistsError && (
                        <p style={{ color: 'red' }}>
                            No se pudieron cargar los artistas
                        </p>
                    )}

                    {!artistsLoading && !artistsError && (
                        <select
                            value={selectedArtistId ?? ''}
                            onChange={(e) => setSelectedArtistId(e.target.value)}
                        >
                            <option value="">— Selecciona un artista —</option>

                            {artists.map((artist) => (
                                <option key={artist.id} value={artist.id}>
                                    {artist.name}
                                </option>
                            ))}
                        </select>
                    )}

                    <br />
                    <br />

                    <button onClick={handleCreateBooking} disabled={creating}>
                        {creating ? 'Creando contratación…' : 'Iniciar contratación'}
                    </button>
                </>
            )}



            <h2>Contrataciones del evento</h2>

            {bookingsLoading && <p>Cargando contrataciones…</p>}

            {bookingsError && (
                <p style={{ color: 'red' }}>
                    No se pudieron cargar las contrataciones del evento
                </p>
            )}

            {!bookingsLoading && !bookingsError && eventBookings.length === 0 && (
                <p>No hay contrataciones asociadas a este evento.</p>
            )}

            {!bookingsLoading && !bookingsError && eventBookings.length > 0 && (
                <ul>
                    {eventBookings.map((booking) => (
                        <li key={booking.id} style={{ marginBottom: 12 }}>
                            <strong>{booking.artist?.name ?? 'Artista desconocido'}</strong>
                            <br />
                            Fecha:{' '}
                            {booking.start_date
                                ? new Date(booking.start_date).toLocaleDateString()
                                : 'Sin fecha'}
                            <br />
                            Estado: <em>{booking.status}</em>
                            <br />
                            <a href={`/bookings/${booking.id}`}>
                                Ver contratación
                            </a>
                        </li>
                    ))}
                </ul>
            )}


        </div>

    );
}
