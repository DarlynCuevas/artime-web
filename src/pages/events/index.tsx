
import Link from 'next/link';
import { useEvents } from '../../hooks/useEvents';


export default function EventsPage() {
  const { events, loading } = useEvents();

  if (loading) return <p>Cargando eventos…</p>;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Mis eventos</h1>

        {/* CTA principal */}
        <Link href="/events/new">
          <button>Crear evento</button>
        </Link>
      </header>

      {events.length === 0 && (
        <p>No tienes eventos todavía.</p>
      )}

      <ul>
        {events.map(event => (
          <li key={event.id}>
            <Link href={`/events/${event.id}`}>
              <strong>{event.name}</strong>
            </Link>
            <div>
              Estado: {event.status}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
