import { useEffect, useState } from 'react';
import { getEventBookings } from '@/services/events/events.service';
import { useAuth } from '@/hooks/auth/useAuth';

export function useEventBookings(eventId?: string) {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !user?.token) return;

    getEventBookings(eventId, user.token)
      .then(setBookings)
      .catch(() =>
        setError('No se pudieron cargar las contrataciones del evento'),
      )
      .finally(() => setLoading(false));
  }, [eventId, user?.token]);

  return {
    bookings,
    loading,
    error,
  };
}

