import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { BookingDto, getBookingById } from '@/services/bookings/bookings.service';


export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user?.token) return;

    getBookingById(id as string, user.token)
      .then(setBooking)
      .catch(() => setError('No se pudo cargar la contratación'))
      .finally(() => setLoading(false));
  }, [id, user?.token]);

  if (loading) return <p>Cargando contratación…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!booking) return <p>No se encontró la contratación.</p>;

  return (
    <div>
      <h1>Detalle de contratación</h1>

      <p><strong>ID:</strong> {booking.id}</p>
      <p><strong>Estado:</strong> {booking.status}</p>
      <p><strong>Fecha:</strong> {booking.start_date}</p>

      {booking.eventId && (
        <p><strong>Evento asociado:</strong> {booking.eventId}</p>
      )}
    </div>
  );
}
