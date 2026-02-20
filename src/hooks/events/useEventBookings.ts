import { useCallback, useEffect, useState } from 'react';
import { getEventBookings } from '@/services/events/events.service';
import { useAuth } from '@/hooks/auth/useAuth';

export function useEventBookings(eventId?: string) {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(() => {
    if (!eventId || !user?.token) return Promise.resolve();
    return getEventBookings(eventId, user.token)
      .then(setBookings)
      .catch(() =>
        setError('No se pudieron cargar las contrataciones del evento'),
      );
  }, [eventId, user?.token]);

  useEffect(() => {
    if (!eventId || !user?.token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchBookings().finally(() => setLoading(false));
  }, [eventId, user?.token, fetchBookings]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
  };
}
