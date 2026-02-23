const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type NegotiationMessageDto = {
  id: string;
  bookingId: string;
  senderRole: 'ARTIST' | 'MANAGER' | 'VENUE' | 'PROMOTER';
  senderUserId: string;
  message?: string;
  proposedFee?: number;
  allIn?: boolean;
  isFinalOffer: boolean;
  createdAt: string;
};

/**
 * Obtener mensajes de negociación de un booking
 */
export async function getNegotiationMessages(
  bookingId: string,
  token: string,
): Promise<NegotiationMessageDto[]> {
  const res = await fetch(
    `${API_BASE_URL}/bookings/${bookingId}/negotiations/messages`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error('Error al cargar los mensajes de negociación');
  }

  return res.json();
}

/**
 * Enviar mensaje de negociación (propuesta normal)
 */
export async function sendNegotiationMessage(
  bookingId: string,
  token: string,
  payload: {
    message: string;
    proposedFee?: number;
    allIn?: boolean;
  }
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bookings/${bookingId}/negotiations/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new Error('Error al enviar el mensaje de negociación');
  }
}

/**
 * Enviar oferta final
 */
export async function sendFinalOffer(
  bookingId: string,
  token: string,
  payload: {
    message: string;
    proposedFee: number;
    allIn?: boolean;
  }
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bookings/${bookingId}/negotiations/final-offer`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new Error('Error al enviar la oferta final');
  }
}

/**
 * Rechazar booking (antes de oferta final)
 */
export async function rejectBooking(
  bookingId: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bookings/${bookingId}/negotiations/reject`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error('Error al rechazar el booking');
  }
}

/**
 * Aceptar oferta final
 */
export async function acceptFinalOffer(
  bookingId: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bookings/${bookingId}/final-offer/accept`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error('Error al aceptar la oferta final');
  }
}

/**
 * Rechazar oferta final
 */
export async function rejectFinalOffer(
  bookingId: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bookings/${bookingId}/final-offer/reject`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error('Error al rechazar la oferta final');
  }
}
