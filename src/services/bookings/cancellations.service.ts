const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function cancelBooking(params: {
  bookingId: string;
  reason: string;
  description?: string;
  token: string;
  initiator: 'ARTIST' | 'VENUE' | 'PROMOTER' | 'SYSTEM';
}): Promise<void> {
  const { bookingId, reason, description, token, initiator } = params;

  const res = await fetch(
    `${API_BASE_URL}/internal/cancellations/${bookingId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason,
        description,
        initiator,
      }),
    }
  );

  if (!res.ok) {
    throw new Error('No se pudo cancelar el booking');
  }
}
