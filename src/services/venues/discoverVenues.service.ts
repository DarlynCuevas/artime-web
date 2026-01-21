import { DiscoverVenue } from "@/types/venues/DiscoverVenue";

export async function discoverVenues(params?: {
  city?: string;
  genres?: string[];
}): Promise<DiscoverVenue[]> {
  const qs = new URLSearchParams();

  if (params?.city) qs.set('city', params.city);
  if (params?.genres?.length) qs.set('genres', params.genres.join(','));

  // Obtener token del usuario autenticado
  let token = '';
  if (typeof window !== 'undefined') {
    try {
      // Si usas un hook global, cámbialo por el método adecuado
      token = JSON.parse(localStorage.getItem('user') || '{}').token || '';
    } catch {}
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/venues-discover/venues?${qs.toString()}`,
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined
  );

  if (!res.ok) {
    throw new Error('DISCOVER_VENUES_FAILED');
  }

  return res.json();
}
