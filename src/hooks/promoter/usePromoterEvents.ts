import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';

export function usePromoterEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/promoters/me/events`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error('No se pudieron cargar los eventos');
        return r.json();
      })
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.token]);

  return { events, loading, error };
}
