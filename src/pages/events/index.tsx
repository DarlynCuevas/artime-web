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

  if (loading) {
    return <p style={{ padding: 40 }}>Cargando eventos…</p>;
  }

  if (error) {
    return (
      <p style={{ padding: 40, color: 'red' }}>
        {error}
      </p>
    );
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
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>
            Eventos
          </h1>
          <p style={{ color: '#555' }}>
            Gestión de eventos y contrataciones asociadas.
          </p>
        </div>

        {canCreateEvent && (
          <button
            onClick={() => router.push('/events/new')}
            style={{
              padding: '8px 12px',
              background: '#000',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Crear evento
          </button>
        )}
      </header>

      {events.length === 0 && (
        <section
          style={{
            padding: 24,
            border: '1px solid #ddd',
            background: '#fafafa',
          }}
        >
          <p>
            No has creado ningún evento todavía.
          </p>
        </section>
      )}

      {events.length > 0 && (
        <section
          style={{
            border: '1px solid #ddd',
            padding: 16,
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <th align="left">Evento</th>
                <th align="left">Fecha</th>
                <th align="left">Estado</th>
                <th align="left">Visibilidad</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  style={{ borderTop: '1px solid #eee' }}
                >
                  <td style={{ padding: '12px 0' }}>
                    <strong>{event.name}</strong>
                  </td>

                  <td>
                    {event.start_date
                      ? new Date(
                          event.start_date,
                        ).toLocaleDateString()
                      : 'Sin fecha'}
                  </td>

                  <td>
                    <span style={{ fontWeight: 500 }}>
                      {event.status}
                    </span>
                  </td>

                  <td>
                    <span style={{ color: '#666' }}>
                      {event.visibility}
                    </span>
                  </td>

                  <td align="right">
                    <Link href={`/events/${event.id}`}>
                      Ver evento
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
