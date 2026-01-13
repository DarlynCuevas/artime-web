const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type BookingDto = {
  eventId: any;
  start_date: string;
  id: string;
  status: string;
  currency: string;
  totalAmount: number;
};
export interface CreateBookingPayload {
  artistId: string;
  currency: string;
  totalAmount: number;
  eventId?: string;
  start_date?: string;
}

export async function getBookingById(
  bookingId: string,
  token: string,
): Promise<BookingDto> {
  const res = await fetch(
    `${API_BASE_URL}/bookings/${bookingId}`,
      {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Error fetching booking');
  }

  return res.json();

  
}

export async function createBooking(
  payload: CreateBookingPayload,
  token: string,
) {
  console.log('payload ', payload);
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Error creating booking');
  }

  return res.json();
}
