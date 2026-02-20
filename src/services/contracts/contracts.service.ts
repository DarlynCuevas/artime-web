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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conditionsAccepted: true,conditionsVersion: 'v1.0', }),
    }
  );

  if (!res.ok) {
    throw new Error('No se pudo firmar el contrato');
  }
}

export function getContractPdfUrl(bookingId: string) {
  return `${API_BASE_URL}/bookings/${bookingId}/contract/pdf`;
}

export async function downloadContractPdf(bookingId: string, token: string) {
  const res = await fetch(getContractPdfUrl(bookingId), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('No se pudo descargar el contrato');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contract-${bookingId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
