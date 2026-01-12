const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type BookingDto = {
  id: string;
  status: string;
  currency: string;
  totalAmount: number;
};

export async function getBookingById(
  bookingId: string,
): Promise<BookingDto> {
  const res = await fetch(
    `${API_BASE_URL}/bookings/${bookingId}`,
  );

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Error fetching booking');
  }

  return res.json();
}
