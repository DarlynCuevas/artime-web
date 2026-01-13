// Crear evento
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsService } from '@/app/services/events.service';


export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await eventsService.createEvent({
      name,
      startDate,
    });

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
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Fecha de inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
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
