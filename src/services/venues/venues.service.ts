import { DiscoverVenue } from "@/types/venues/DiscoverVenue";

type VenueProfilePayload = {
  name: string;
  city?: string;
  address?: string;
  capacity?: number | null;
  description?: string;
  genres?: string[];
  amenities?: string[];
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export async function getVenueById(
  venueId: string,
  token?: string,
): Promise<{
  id: string;
  name: string;
  city: string;
  description: string;
  capacity?: number;
  address?: string;
  genres?: string[];
  images?: string[];
}> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/venues/${venueId}`,
    token
      ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      : undefined,
  );

  if (!res.ok) {
    throw new Error('VENUE_NOT_FOUND');
  }

  return res.json();
}

export async function getMyVenueProfile(token: string): Promise<any> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/venues/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('VENUE_PROFILE_NOT_FOUND');
  }

  return res.json();
}

export async function updateMyVenueProfile(payload: VenueProfilePayload, token: string): Promise<any> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/venues/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('VENUE_PROFILE_NOT_FOUND');
    }
    throw new Error('VENUE_PROFILE_UPDATE_FAILED');
  }

  return res.json();
}

export async function getVenueAvailability(
  venueId: string,
  from: string,
  to: string,
  token?: string,
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/venues/${venueId}/availability?from=${from}&to=${to}`,
    token
      ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      : undefined,
  );

  if (!res.ok) {
    throw new Error('Failed to fetch venue availability');
  }

  return res.json();
}
