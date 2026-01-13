import { eventsService } from '@/services/events/events.service';
import { useEffect, useState } from 'react';
import { useAuth } from '../useAuth';


export function useEventInterestedArtists(eventId: string) {
  const [artists, setArtists] = useState<
    { invitationId: string; artistId: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
 const { user } = useAuth();
  useEffect(() => {
     if (!user?.token) return;
    eventsService
      .getInterestedArtists(eventId, user.token)
      .then(setArtists)
      .finally(() => setLoading(false));
  }, [eventId, user?.token]);

  return { artists, loading };
}
