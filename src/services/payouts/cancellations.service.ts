const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function cancelBooking(
  bookingId: string,
  reason: string,
): Promise<{ status: string }> {
  const res = await fetch(
    `${API_BASE_URL}/internal/cancellations/${bookingId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    },
  );

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Error cancelling booking');
  }

  return res.json();
}
