import { useState } from 'react';
import { createBooking, CreateBookingPayload } from '../../services/bookings/bookings.service';


export function useCreateBooking(token: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (payload: CreateBookingPayload) => {
    try {
      setLoading(true);
      setError(null);
      return await createBooking(payload, token);
    } catch (err) {
      setError('No se pudo crear el booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}
