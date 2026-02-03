import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';

type EventInvitation = {
  invitationId: string;
  artistId: string;
  status: string;
};

export function useEventInvitations(eventId?: string | null) {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<EventInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(() => {
    if (!eventId || !user?.token) return Promise.resolve();
    return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/invitations`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error('No se pudieron cargar las invitaciones');
        return r.json();
      })
      .then(setInvitations);
  }, [eventId, user?.token]);

  useEffect(() => {
    if (!eventId || !user?.token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchInvitations()
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchInvitations().catch(() => undefined);
    }, 10_000);

    return () => clearInterval(interval);
  }, [eventId, user?.token, fetchInvitations]);

  return { invitations, loading, setInvitations, refetch: fetchInvitations };
}
