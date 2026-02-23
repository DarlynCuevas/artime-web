const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type VenueSuggestionStatus = 'PENDING' | 'VIEWED' | 'SAVED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export type VenueSuggestion = {
  id: string;
  status: VenueSuggestionStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  artistId: string;
  artistName: string;
  artistCity: string | null;
  artistGenres: string[];
  managerId: string;
  managerName: string;
};

export async function createVenueSuggestion(
  token: string,
  payload: { venueId: string; artistId: string; message?: string | null },
) {
  const res = await fetch(`${API}/managers/suggestions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo enviar la sugerencia');
  }

  return res.json();
}

export async function listVenueSuggestions(
  token: string,
  status: VenueSuggestionStatus | 'ALL' = 'ALL',
): Promise<VenueSuggestion[]> {
  const qs = new URLSearchParams();
  qs.set('status', status);
  const res = await fetch(`${API}/venues/suggestions?${qs.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudieron cargar las sugerencias');
  }

  return res.json();
}

export async function updateVenueSuggestionStatus(
  token: string,
  suggestionId: string,
  status: 'VIEWED' | 'SAVED' | 'ACCEPTED' | 'DECLINED',
) {
  const res = await fetch(`${API}/venues/suggestions/${suggestionId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo actualizar la sugerencia');
  }

  return res.json();
}
