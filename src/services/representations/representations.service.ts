const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type RepresentationResolveAction = 'ACCEPT' | 'REJECT';

export async function createRepresentationRequest(params: {
  artistId: string;
  commissionPercentage: number;
  token: string;
}) {
  const { artistId, commissionPercentage, token } = params;
  const res = await fetch(`${API_BASE_URL}/artists/${artistId}/representation-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ commissionPercentage }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'No se pudo enviar la solicitud de representación');
  }

  return data;
}

export async function resolveRepresentationRequest(params: {
  requestId: string;
  action: RepresentationResolveAction;
  token: string;
}) {
  const { requestId, action, token } = params;

  const res = await fetch(`${API_BASE_URL}/representation-requests/${requestId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'No se pudo resolver la solicitud');
  }

  return data;
}
