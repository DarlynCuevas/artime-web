const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type CancellationInitiator = 'ARTIST' | 'VENUE' | 'PROMOTER' | 'SYSTEM' | 'MANAGER';

export async function cancelBooking(params: {
  bookingId: string;
  reason: string;
  description?: string;
  token: string;
  initiator?: CancellationInitiator;
  bookingStatus?: string;
  hasPayments?: boolean;
  useLegacy?: boolean;
}): Promise<void> {
  const { bookingId, reason, description, token } = params;

  // Actualmente no existe un endpoint público para cancelaciones con pagos; se usa siempre el endpoint estándar
  // de bookings, que infiere el initiator según el contexto de auth. Si se habilita el endpoint interno,
  // reintroducir la lógica de selección aquí.

  const url = `${API_BASE_URL}/bookings/${bookingId}/cancel`;
  const payload = { reason, description };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    // Si ya está cancelado, evitamos romper UX y retornamos silenciosamente
    const msg = (data.message || '').toString().toLowerCase();
    const alreadyCanceled = res.status === 409 || res.status === 400;
    if (alreadyCanceled && msg.includes('cancel')) {
      return;
    }

    throw new Error(data.message || 'No se pudo cancelar el booking');
  }
}
