import { useEffect, useState } from 'react';
import { eventsService } from '../services/events.service';


export function useEventInterestedArtists(eventId: string) {
  const [artists, setArtists] = useState<
    { invitationId: string; artistId: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsService
      .getInterestedArtists(eventId)
      .then(setArtists)
      .finally(() => setLoading(false));
  }, [eventId]);

  return { artists, loading };
}
