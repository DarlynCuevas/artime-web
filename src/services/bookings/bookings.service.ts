import { Booking, BookingStatus, Role } from "@/types/booking";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type BookingDto = {
  eventId: any;
  start_date: string;
  id: string;
  status: BookingStatus;
  currency: string;
  totalAmount: number;
  handledByRole: Role;
  handledByUserId: string | null;
  handledAt: string | null;
  messagesCount?: number;
  artistId?: string;
  venueId?: string;
  promoterId?: string | null;
  managerId?: string | null;
  venueName?: string | null;
  artistName?: string | null;
  venue?: {
    id?: string;
    name?: string;
    city?: string;
  } | null;
  artist?: {
    id?: string;
    name?: string;
  } | null;
};
export interface CreateBookingPayload {
  artistId: string;
  currency: string;
  totalAmount: number;
  eventId?: string;
  start_date?: string;
  message?: string;
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
  console.log(payload);
  
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

export async function getBookingsByEvent(
  eventId: string,
  token: string,
): Promise<Booking[]> {
  const res = await fetch(
    `${API_BASE_URL}/events/${eventId}/bookings`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Error fetching event bookings');
  }

  return res.json();
}

export async function acceptBooking(
  bookingId: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/bookings/${bookingId}/accept`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error('Error al aceptar la contratación');
  }
}
