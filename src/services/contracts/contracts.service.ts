const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getContractByBooking(
  bookingId: string,
  token: string,
) {
  const res = await fetch(
    `${API_BASE_URL}/contracts/by-booking/${bookingId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('No se pudo obtener el contrato');
  }

  return res.json();
}

export async function signContract(
  contractId: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/contracts/${contractId}/sign`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('No se pudo firmar el contrato');
  }
}
