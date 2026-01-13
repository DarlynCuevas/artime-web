
import { useState } from 'react';
import { getBookingById, BookingDto } from '../../services/bookings/bookings.service';
import { cancelBooking } from '../../services/payouts/cancellations.service';
import { useAuth } from '@/hooks/useAuth';

export function useBooking() {
  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadBooking = async (bookingId: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.token) throw new Error('No token');
      const data = await getBookingById(bookingId, user.token);
      setBooking(data);
    } catch (err: any) {
      setError(err.message);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (reason: string) => {
    if (!booking) return;

    setLoading(true);
    setError(null);

    try {
      await cancelBooking(booking.id, reason);
      await loadBooking(booking.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canCancel =
    booking?.status !== 'CANCELLED' &&
    booking?.status !== 'COMPLETED';

  return {
    booking,
    loading,
    error,
    loadBooking,
    cancel,
    canCancel,
  };
}
