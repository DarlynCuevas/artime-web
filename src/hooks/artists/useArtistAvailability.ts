import { useEffect, useState } from 'react';
import { getArtistAvailability } from '@/services/artists/artists.service';

export function useArtistAvailability(
  artistId?: string,
  month?: Date,
  token?: string,
) {
  const [days, setDays] = useState<
    { date: string; status: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE' }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('[useArtistAvailability] useEffect', { artistId, month, token });
    if (!artistId || !month || !token) {
      console.log('[useArtistAvailability] NO FETCH: Falta algún parámetro', { artistId, month, token });
      return;
    }

    console.log('[useArtistAvailability] FETCHING', {
      artistId,
      month,
      token,
    });

    const from = new Date(
      Date.UTC(month.getFullYear(), month.getMonth(), 1),
    )
      .toISOString()
      .slice(0, 10);

    const to = new Date(
      Date.UTC(month.getFullYear(), month.getMonth() + 1, 0),
    )
      .toISOString()
      .slice(0, 10);

    setLoading(true);

    getArtistAvailability(artistId, from, to, token)
      .then((data) => {
        console.log('[useArtistAvailability] RESPONSE', data);
        setDays(data.days);
      })
      .catch((err) => {
        console.error('[useArtistAvailability] ERROR', err);
      })
      .finally(() => setLoading(false));
  }, [artistId, month, token]);

  return { days, loading };
}
