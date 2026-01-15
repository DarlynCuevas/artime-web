import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { eventsService } from '@/services/events/events.service';
import type { Event } from '@/types/event';
import { useRouter } from 'next/router';


export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const canCreateEvent = user?.role === 'VENUE';

  useEffect(() => {
    if (!user?.token) return;

    eventsService
      .getEvents(user.token)
      .then(setEvents)
      .catch(() => setError('No se pudieron cargar los eventos'))
      .finally(() => setLoading(false));
  }, [user?.token]);

  if (loading) return <p>Cargando eventos…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Mis eventos</h1>

      {canCreateEvent && (
        <button
          onClick={() => router.push('/events/new')}
          style={{ marginBottom: 24 }}
        >
          Crear evento
        </button>
      )}


      {events.length === 0 && (
        <p>No has creado ningún evento todavía.</p>
      )}

      {events.length > 0 && (
        <ul>
          {events.map((event) => (
            <li key={event.id} style={{ marginBottom: 16 }}>
              <strong>{event.name}</strong>
              <br />
              Fecha:{' '}
              {event.start_date
                ? new Date(event.start_date).toLocaleDateString()
                : 'Sin fecha'}
              <br />
              Estado: {event.status}
              <br />
              Visibilidad: {event.visibility}
              <br />
              <Link href={`/events/${event.id}`}>
                Ver evento
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

