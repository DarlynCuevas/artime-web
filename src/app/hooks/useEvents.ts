// Hook para eventos
import { useEffect, useState } from 'react';
import type { Event } from '../types/event';
import { eventsService } from '../services/events.service';


export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsService
      .getEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  return { events, loading };
}
