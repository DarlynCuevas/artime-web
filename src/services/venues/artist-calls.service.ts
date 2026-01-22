const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function createArtistCall(
  params: {
    date: string;
    city: string;
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
