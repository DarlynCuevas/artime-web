// Página de detalle de evento para Pages Router
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { Event } from '@/types/event';
import { eventsService } from '@/services/events/events.service';
import { useAuth } from '@/hooks/useAuth';
import { useCreateBooking } from '@/hooks/useCreateBooking';


export default function EventDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { submit: createBooking, loading: creating } = useCreateBooking(user.token);
    const canInitiateBooking =
        user?.role === 'VENUE' || user?.role === 'MANAGER';



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
        try {


            const booking = await createBooking({
                eventId: event.id,
                artistId: '11111111-1111-1111-1111-111111111111',
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

        </div>
    );
}
