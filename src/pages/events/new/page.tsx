// Crear evento (Pages Router)
import { useState } from 'react';
import { useRouter } from 'next/router';
import { eventsService } from '@/services/events/events.service';
import { useAuth } from '@/hooks/useAuth';

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [start_date, setStartDate] = useState('');
  const { user } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await eventsService.createEvent({
      name,
      start_date,
    }, user.token);

    router.push('/events');
  }

  return (
    <div>
      <h1>Crear evento</h1>

      <p>
        El evento es un contexto de planificación.
        Las contrataciones se realizan después.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre del evento</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Fecha de inicio</label>
          <input
            type="date"
            value={start_date}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <button type="submit">
          Crear evento
        </button>
      </form>
    </div>
  );
}
