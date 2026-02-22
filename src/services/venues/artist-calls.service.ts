const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function createArtistCall(
  params: {
    date: string;
    city?: string;
    filters?: Record<string, any>;
  },
  token: string,
) {
  const res = await fetch(`${API_BASE_URL}/venues/artist-calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo crear la convocatoria');
  }

  return res.json();
}

export type InterestedArtistCall = {
  callId: string;
  date: string | null;
  city: string | null;
  artistId: string | null;
  artistName: string;
  artistCity: string | null;
  basePrice: number | null;
  currency: string;
  respondedAt: string;
  offeredPrice: number | null;
};

export async function getInterestedArtistCalls(token: string): Promise<InterestedArtistCall[]> {
  const res = await fetch(`${API_BASE_URL}/venues/artist-calls/interested`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudieron cargar los interesados');
  }

  return res.json();
}
