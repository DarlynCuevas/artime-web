const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function createArtistCalendarBlock(
  date: string,
  token: string,
  reason?: string,
) {
  const res = await fetch(`${API_BASE_URL}/artist/calendar/blocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ date, reason }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo bloquear el día');
  }

  return res.json();
}

export async function getArtistCalendarBlocks(
  from: string,
  to: string,
  token: string,
) {
  const res = await fetch(
    `${API_BASE_URL}/artist/calendar/blocks?from=${from}&to=${to}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudieron cargar los bloqueos');
  }

  return res.json();
}

export async function deleteArtistCalendarBlock(
  date: string,
  token: string,
) {
  const res = await fetch(
    `${API_BASE_URL}/artist/calendar/blocks?date=${date}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo desbloquear el día');
  }

  return res.json();
}

export async function getPublicArtistCalendarBlocks(
  artistId: string,
  from: string,
  to: string,
  token: string,
) {
  const res = await fetch(
    `${API_BASE_URL}/artist/calendar/${artistId}/blocks?from=${from}&to=${to}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudieron cargar los bloqueos');
  }

  return res.json();
}

export async function getArtistBookingByDate(
  date: string,
  token: string,
) {
  const res = await fetch(
    `${API_BASE_URL}/artist/calendar/booking?date=${date}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo cargar el booking');
  }

  return res.json();
}
