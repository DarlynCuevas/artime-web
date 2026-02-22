export async function getMyManagerProfile(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/managers/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo cargar el perfil de manager');
  }
  return res.json();
}

export async function updateMyManagerProfile(payload: { name?: string }, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/managers/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo guardar el perfil');
  }
}

export async function getManagerPublicProfile(managerId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/managers/${managerId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo cargar el perfil público de manager');
  }
  return res.json();
}

export async function getMyRepresentedArtists(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/managers/me/represented`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudieron cargar los artistas representados');
  }
  return res.json();
}
