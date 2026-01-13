// Servicio para eventos
import type { Event } from '../../types/event';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const eventsService = {
    async getEvents(token: string): Promise<Event[]> {

        const res = await fetch(`${BASE_URL}/events`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            throw new Error('Failed to fetch events');
        }

        return res.json();
    },

    async getEvent(id: string, token: string): Promise<Event> {
        const res = await fetch(`${BASE_URL}/events/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            throw new Error('Failed to fetch event');
        }

        return res.json();
    },

    async createEvent(payload: {
        name: string;
        start_date: string;
        endDate?: string | null;
        venueId?: string | null;
        type?: string | null;
        estimatedBudget?: number | null;
        description?: string | null;
    }, token: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error('Failed to create event');
        }
    },

    async cancelEvent(id: string, token: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/events/${id}/cancel`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            throw new Error('Failed to cancel event');
        }
    },

    async startSearch(id: string, token: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/events/${id}/start-search`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) throw new Error('Failed to start search');
    },

    async getInterestedArtists(eventId: string, token: string): Promise<
        { invitationId: string; artistId: string }[]
    > {
        const res = await fetch(
            `${BASE_URL}/events/${eventId}/interested-artists`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        if (!res.ok) {
            throw new Error('Failed to fetch interested artists');
        }

        return res.json();
    },
};
export async function getEventBookings(
    eventId: string,
    token: string,
) {
    const res = await fetch(
        `${BASE_URL}/events/${eventId}/bookings`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    ); 

    if (!res.ok) {
        throw new Error('Error fetching event bookings');
    }

    return res.json();
}

