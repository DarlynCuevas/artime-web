// web/src/services/artists/artists.service.ts
import type { ArtistBookingConditions } from '@/types/artists/booking-conditions';

export async function getArtists(token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/artists`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Error fetching artists');
  }

  return res.json();
}

export async function discoverArtists(token: string) {
  console.log('llamada al back');
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/discover`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('DISCOVER_ARTISTS_FAILED');
  }

  return res.json();
}

export async function getMyArtistProfile(token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo obtener el perfil');
  }

  return res.json();
}

export type AvailabilityDay = {
  date: string;
  status: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE';
};

export type UpdateArtistPayload = {
  name?: string;
  city?: string;
  genres?: string[];
  bio?: string;
  format?: string;
  basePrice?: number;
  currency?: string;
  isNegotiable?: boolean;
  managerId?: string | null;
  rating?: number;
  bookingConditions?: ArtistBookingConditions;
};

export async function updateMyArtistProfile(
  payload: UpdateArtistPayload,
  token: string,
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo actualizar el perfil');
  }

  return res.json();
}

export async function getArtistAvailability(
  artistId: string,
  from: string,
  to: string,
  token: string,
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/${artistId}/availability?from=${from}&to=${to}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch artist availability');
  }

  return res.json();
}

export async function getArtistProfileById(
  artistId: string,
  token: string,
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/${artistId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch artist profile');
  }

  return res.json();
}

export async function getArtistBookingConditions(
  artistId: string,
  token: string,
): Promise<{ artistId: string; bookingConditions: ArtistBookingConditions; editableBy: 'ARTIST' | 'MANAGER' | null }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/${artistId}/booking-conditions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudieron cargar las condiciones');
  }

  return res.json();
}

export async function updateArtistBookingConditions(
  artistId: string,
  bookingConditions: ArtistBookingConditions,
  token: string,
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/${artistId}/booking-conditions`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingConditions }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudieron actualizar las condiciones');
  }

  return res.json();
}
