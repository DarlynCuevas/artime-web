
import { useEffect, useState } from 'react';
import { getBookingById, BookingDto } from '../../services/bookings/bookings.service';
import { cancelBooking } from '../../services/payouts/cancellations.service';
import { useAuth } from '@/hooks/useAuth';
import { Booking } from '@/types/booking';

export function useBooking(bookingId?: string) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const loadBooking = async () => {
    if (!bookingId || !user?.token) return;

    setLoading(true);
    try {
      const data = await getBookingById(bookingId, user.token);
      setBooking(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [bookingId, user?.token]);
  useEffect(() => {
    if (!bookingId || !user?.token) return;

    setLoading(true);


    getBookingById(bookingId, user.token)
      .then(setBooking)
      .finally(() => setLoading(false));
  }, [bookingId, user?.token]);


  const handledByRole = booking?.handledByRole ?? null;

  return {
    booking,
    loading,
    isHandledByMe:
      handledByRole === user?.role &&
      booking?.handledByUserId === user?.id,
    isHandledByOther:
      handledByRole !== null &&
      handledByRole !== user?.role,
    refresh: loadBooking
  };

}


