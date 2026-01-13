
import { useState } from 'react';
import { useBooking } from '../../hooks/bookings/useBooking';


export default function BookingPage() {
  const [bookingId, setBookingId] = useState('');
  const {
    booking,
    loading,
    error,
    loadBooking,
    cancel,
    canCancel,
  } = useBooking();

  const onCancel = async () => {
    const confirmed = window.confirm(
      '¿Seguro que quieres cancelar esta actuación?\n\nLa cancelación no implica devolución automática.',
    );

    if (!confirmed) return;

    await cancel('Cancelación iniciada desde la interfaz');
  };

  const renderStatus = () => {
    if (!booking) return null;

    switch (booking.status) {
      case 'PAID_FULL':
        return (
          <p style={{ color: 'green' }}>
            🟢 Actuación confirmada y pagada
          </p>
        );
      case 'CANCELLED':
        return (
          <p style={{ color: 'red' }}>
            🔴 Actuación cancelada
          </p>
        );
      case 'COMPLETED':
        return (
          <p style={{ color: 'gray' }}>
            ✅ Actuación realizada
          </p>
        );
      default:
        return <p>Estado: {booking.status}</p>;
    }
  };

  return (
    <main style={{ padding: 40, maxWidth: 600 }}>
      <h1>Detalle de actuación</h1>

      {!booking && (
        <>
          <input
            placeholder="ID de la actuación"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            style={{ width: '100%' }}
          />

          <button
            onClick={() => loadBooking(bookingId)}
            disabled={!bookingId || loading}
            style={{ marginTop: 10 }}
          >
            Ver actuación
          </button>
        </>
      )}

      {loading && <p>Procesando…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {booking && (
        <div style={{ marginTop: 30 }}>
          {renderStatus()}

          <div style={{ marginTop: 20 }}>
            <p><strong>Importe acordado</strong></p>
            <p style={{ fontSize: 24 }}>
              {booking.totalAmount} {booking.currency}
            </p>
          </div>

          {canCancel && (
            <div style={{ marginTop: 30 }}>
              <button
                onClick={onCancel}
                disabled={loading}
                style={{ color: 'red' }}
              >
                Cancelar actuación
              </button>

              <p style={{ fontSize: 12, marginTop: 10 }}>
                La cancelación no implica devolución automática.
                El caso será revisado según las condiciones del contrato.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
