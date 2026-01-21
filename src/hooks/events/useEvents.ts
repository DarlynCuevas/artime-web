export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const data = await eventsService.getEvents(user.token);
      setEvents(data);
    } catch {
      setError('Error loading events');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refresh: fetchEvents };
}
import { useEffect, useState, useCallback } from 'react';
import type { Event } from '../../types/event';
import { eventsService } from '../../services/events/events.service';
import { useAuth } from '../auth/useAuth';

export function useEvent(eventId: string) {
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const data = await eventsService.getEvent(eventId, user.token);
      setEvent(data);
    } catch {
      setError('Error loading event');
    } finally {
      setLoading(false);
    }
  }, [eventId, user?.token]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const changeVisibility = async (
    visibility: 'PRIVATE' | 'VISIBLE'
  ) => {
    if (!user?.token) return;
    await eventsService.updateEventVisibility(
      eventId,
      visibility,
      user.token
    );
    await fetchEvent();
  };

  return {
    event,
    loading,
    error,
    refresh: fetchEvent,
    changeVisibility,
  };
}
