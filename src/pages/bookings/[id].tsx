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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);




  useEffect(() => {
    if (!id || !user?.token) return;

    getBookingById(id as string, user.token)
      .then(setBooking)
      .catch(() => setError('No se pudo cargar la contratación'))
      .finally(() => setLoading(false));
  }, [id, user?.token]);

  if (!booking) {
    return <p>Cargando booking…</p>;
  }

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!booking) return <p>No se encontró la contratación.</p>;

  const isCancelled =
    booking.status === 'CANCELLED' ||
    booking.status === 'CANCELLED_PENDING_REVIEW';

  const isPendingReview =
    booking.status === 'CANCELLED_PENDING_REVIEW';



  return (
    <div>
      <h1>Detalle de contratación</h1>

      <p><strong>ID:</strong> {booking.id}</p>
      <p><strong>Estado:</strong> {booking.status}</p>
      {isCancelled && (
        <div style={{ marginTop: 16, padding: 12, border: '1px solid #ccc' }}>
          {isPendingReview ? (
            <>
              <strong>CANCELLED — Pendiente de revisión</strong>
              <p>
                La actuación ha sido cancelada correctamente.
                El caso será revisado por ARTIME teniendo en cuenta
                las circunstancias y el estado de la contratación.
              </p>
              <p>
                El importe, si existe, permanece retenido hasta
                que se resuelva el expediente.
              </p>
            </>
          ) : (
            <>
              <strong>CANCELLED</strong>
              <p>
                La actuación ha sido cancelada.
              </p>
            </>
          )}
        </div>
      )}

      {!isCancelled && (
        <button
          type="button"
          style={{ marginTop: '16px' }}
          onClick={() => setShowCancelModal(true)}
        >
          Cancelar actuación
        </button>


      )}

      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              borderRadius: '6px',
            }}
          >
            <h2>Cancelar actuación</h2>

            <p>
              Al cancelar esta actuación, el caso quedará pendiente de revisión.
            </p>
            <p>
              La cancelación no implica la devolución automática del dinero.
            </p>
            <p>
              ARTIME mantiene su comisión por los servicios de gestión e intermediación
              ya prestados.
            </p>

            <textarea
              placeholder="Explica brevemente el motivo de la cancelación."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: '100%', marginTop: '12px', minHeight: '80px' }}
            />

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={cancelReason.trim().length === 0 || isCancelling}
                onClick={async () => {
                  if (!booking) return;

                  try {
                    setIsCancelling(true);

                    const res = await fetch(
                      `${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings/${booking.id}/cancel`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${user?.token}`,
                        },
                        body: JSON.stringify({
                          reason: user?.role === 'ARTIST' ? 'ARTIST_JUSTIFIED' : 'VENUE',
                          description: cancelReason,
                        }),
                      }
                    );

                    if (!res.ok) {
                      throw new Error('Error cancelling booking');
                    }

                    const updatedBooking = await res.json();
                    setBooking(updatedBooking);

                    setShowCancelModal(false);
                    setCancelReason('');
                  } catch (error) {
                    alert('No se pudo cancelar la actuación');
                  } finally {
                    setIsCancelling(false);
                  }
                }}
              >
                {isCancelling ? 'Cancelando…' : 'Confirmar cancelación'}
              </button>


              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                Volver atrás
              </button>
            </div>
          </div>
        </div>
      )}


      <p><strong>Fecha:</strong> {booking.start_date}</p>

      {booking.eventId && (
        <p><strong>Evento asociado:</strong> {booking.eventId}</p>
      )}
    </div>
  );
}
