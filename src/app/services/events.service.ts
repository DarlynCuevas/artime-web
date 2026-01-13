// Servicio para eventos
import type { Event } from '../types/event';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const eventsService = {
    async getEvents(): Promise<Event[]> {
        const res = await fetch(`${BASE_URL}/events`, {
            credentials: 'include',
        });

        if (!res.ok) {
            throw new Error('Failed to fetch events');
        }

        return res.json();
    },

    async getEvent(id: string): Promise<Event> {
        const res = await fetch(`${BASE_URL}/events/${id}`, {
            credentials: 'include',
        });

        if (!res.ok) {
            throw new Error('Failed to fetch event');
        }

        return res.json();
    },

    async createEvent(payload: {
        name: string;
        startDate: string;
        endDate?: string | null;
        venueId?: string | null;
        type?: string | null;
        estimatedBudget?: number | null;
        description?: string | null;
    }): Promise<void> {
        const res = await fetch(`${BASE_URL}/events`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error('Failed to create event');
        }
    },

    async cancelEvent(id: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/events/${id}/cancel`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!res.ok) {
            throw new Error('Failed to cancel event');
        }
    },

    async startSearch(id: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/events/${id}/start-search`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!res.ok) throw new Error('Failed to start search');
    },

    async getInterestedArtists(eventId: string): Promise<
        { invitationId: string; artistId: string }[]
    > {
        const res = await fetch(
            `${BASE_URL}/events/${eventId}/interested-artists`,
            { credentials: 'include' },
        );

        if (!res.ok) {
            throw new Error('Failed to fetch interested artists');
        }

        return res.json();
    }


};
