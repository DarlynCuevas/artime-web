import { useEffect, useState } from 'react';
import { getVenueAvailability } from '@/services/venues/venues.service';

export function useVenueAvailability(
    venueId?: string,
    month?: Date,
    token?: string,
) {
    const [days, setDays] = useState<
        { date: string; status: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE' }[]
    >([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log('[useVenueAvailability] useEffect', { venueId, month });
        if (!venueId || !month) {
            console.log('[useVenueAvailability] NO FETCH: Falta algún parámetro', { venueId, month });
            return;
        }

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

        // venue/availability might not need token as it's a public endpoint
        getVenueAvailability(venueId, from, to, token)
            .then((data) => {
                setDays(data.days);
            })
            .catch((err) => {
                console.error('[useVenueAvailability] ERROR', err);
            })
            .finally(() => setLoading(false));
    }, [venueId, month, token]);

    return { days, loading };
}
