import { DiscoverVenue } from "@/types/venues/DiscoverVenue";

export async function getVenueById(
  venueId: string,
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
  );

  if (!res.ok) {
    throw new Error('VENUE_NOT_FOUND');
  }

  return res.json();
}

