import { DiscoverVenue } from "@/types/venues/DiscoverVenue";
import { supabase } from "@/services/supabase/supabaseClient";

export async function discoverVenues(params?: {
  city?: string;
  genres?: string[];
}): Promise<DiscoverVenue[]> {
  const qs = new URLSearchParams();

  if (params?.city) qs.set('city', params.city);
  if (params?.genres?.length) qs.set('genres', params.genres.join(','));

  // Obtener token de la sesión actual (Supabase)
  let token = '';
  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? '';
  } catch { }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/venues/discover?${qs.toString()}`,
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
