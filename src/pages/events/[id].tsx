// Página de detalle de evento para Pages Router
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { Event } from '@/types/event';
import { eventsService } from '@/services/events/events.service';
import { useAuth } from '@/hooks/useAuth';
import { useCreateBooking } from '@/hooks/bookings/useCreateBooking';
import { useArtists } from '@/hooks/artists/useArtists';
import { useEventBookings } from '@/hooks/events/useEventBookings';




export default function EventDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const {
        bookings: eventBookings,
        loading: bookingsLoading,
        error: bookingsError,
    } = useEventBookings(event?.id);

    const { submit: createBooking, loading: creating } = useCreateBooking(user.token);
    const canInitiateBooking =
        user?.role === 'VENUE' || user?.role === 'MANAGER';
    const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
    const { artists, artistsLoading, artistsError } = useArtists();



    useEffect(() => {
        if (!id || !user?.token) return;
        if (id === 'new') return;
        eventsService.getEvent(id as string, user.token)
            .then(setEvent)
            .catch(() => setError('No se pudo cargar el evento.'))
            .finally(() => setLoading(false));
    }, [id, user?.token]);

    if (loading) return <p>Cargando evento…</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!event) return <p>No se encontró el evento.</p>;

    const handleCreateBooking = async () => {
        if (!user || !event) return;
        if (!selectedArtistId) {
            alert('Selecciona un artista antes de iniciar la contratación');
            return;
        }
        try {


            const booking = await createBooking({
                eventId: event.id,
                artistId: selectedArtistId!,
                start_date: event.start_date,
                currency: 'EUR', // Ajusta según corresponda
                totalAmount: 1000 // Ajusta según corresponda
            });

            router.push(`/bookings/${booking.id}`);
        } catch (error) {
            alert('No se pudo iniciar la contratación');
        }
    };


    return (
        <div>
            <h1>{event.name}</h1>
            <p>Estado: {event.status}</p>
            {canInitiateBooking && (
                <button
                    onClick={handleCreateBooking}
                    disabled={creating}
                    style={{ marginTop: '16px' }}
                >
                    {creating ? 'Creando booking…' : 'Iniciar contratación'}
                </button>
            )}
            <h3>Selecciona un artista</h3>

            {artistsLoading && <p>Cargando artistas…</p>}
            {artistsError && <p style={{ color: 'red' }}>{artistsError}</p>}

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

            <h2>Contrataciones del evento</h2>

            {bookingsLoading && <p>Cargando contrataciones…</p>}
            {bookingsError && (
                <p style={{ color: 'red' }}>{bookingsError}</p>
            )}

            {!bookingsLoading && !bookingsError && eventBookings.length === 0 && (
                <p>No hay contrataciones asociadas a este evento.</p>
            )}

            {!bookingsLoading && !bookingsError && eventBookings.length > 0 && (
                <ul>
                    {eventBookings.map((booking) => (
                        <li key={booking.id}>
                            <strong>{booking.artist?.name}</strong> —{' '}
                            {booking.start_date} —{' '}
                            <em>{booking.status}</em>
                        </li>
                    ))}
                </ul>
            )}


        </div>

    );
}
