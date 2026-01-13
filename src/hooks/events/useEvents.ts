// Hook para eventos
import { useEffect, useState } from 'react';
import type { Event } from '../../types/event';
import { eventsService } from '../../services/events/events.service';
import { useAuth } from '../useAuth';


export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.token) return;
    eventsService
      .getEvents(user.token)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [user?.token]);

  return { events, loading };
}

