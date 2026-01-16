import { NegotiationPanel } from "@/components/bookings/NegotiationPanel";
import { useBooking } from "@/hooks/bookings/useBooking";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user-role";
import { useRouter } from "next/router";
import { useState } from "react";

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const bookingId = typeof id === 'string' ? id : undefined;

  const {
    booking,
    loading,
    isHandledByMe,
    isHandledByOther,
    refresh,
  } = useBooking(bookingId);

  if (loading) return <p style={{ padding: 24 }}>Cargando contratación…</p>;
  if (!booking) return <p>No se pudo cargar la contratación.</p>;

  const isCancelled =
    booking.status === 'CANCELLED' ||
    booking.status === 'CANCELLED_PENDING_REVIEW';

  const isPendingReview =
    booking.status === 'CANCELLED_PENDING_REVIEW';

  return (
    <main
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      {/* HEADER */}
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>
          Contratación
        </h1>

        <p style={{ color: '#555' }}>
          Estado actual de la actuación y negociación asociada.
        </p>

        {isHandledByMe && (
          <p style={{ color: '#0057ff', marginTop: 8 }}>
            Estás gestionando esta contratación
          </p>
        )}

        {isHandledByOther && (
          <p style={{ color: '#999', marginTop: 8 }}>
            Esta contratación está siendo gestionada por{' '}
            {user.role === 'ARTIST' ? 'tu manager' : 'el artista'}
          </p>
        )}
      </header>

      {/* ESTADO CRÍTICO */}
      {isCancelled && (
        <section
          style={{
            border: '1px solid #ccc',
            padding: 16,
            marginBottom: 32,
            background: '#fafafa',
          }}
        >
          {isPendingReview ? (
            <>
              <strong>CANCELADA — Pendiente de revisión</strong>
              <p>
                La actuación ha sido cancelada y será revisada por ARTIME.
                El importe permanece retenido hasta resolución.
              </p>
            </>
          ) : (
            <>
              <strong>CANCELADA</strong>
              <p>La actuación ha sido cancelada.</p>
            </>
          )}
        </section>
      )}

      {/* DATOS CONTRACTUALES */}
      <section
        style={{
          border: '1px solid #ddd',
          padding: 16,
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 16 }}>
          Datos de la contratación
        </h2>

        <p><strong>ID:</strong> {booking.id}</p>
        <p><strong>Fecha:</strong> {booking.start_date}</p>
        <p><strong>Importe:</strong> {booking.totalAmount} €</p>
        <p><strong>Estado:</strong> {booking.status}</p>

        {booking.eventId && (
          <p><strong>Evento asociado:</strong> {booking.eventId}</p>
        )}
      </section>

      {/* NEGOCIACIÓN */}
      <section style={{ marginBottom: 32 }}>
        <NegotiationPanel
          bookingId={booking.id}
          isHandledByOther={isHandledByOther}
          bookingStatus={booking.status}
          userRole={user?.role as UserRole}
          onBookingUpdated={refresh}
        />
      </section>

      {/* ACCIONES CRÍTICAS */}
      {!isCancelled && (
        <section
          style={{
            borderTop: '1px solid #eee',
            paddingTop: 24,
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>
            Acciones
          </h2>

          <button
            type="button"
            disabled={isHandledByOther}
            onClick={() => setShowCancelModal(true)}
            style={{
              background: '#fff',
              border: '1px solid #000',
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            Cancelar actuación
          </button>

          {isHandledByOther && (
            <p style={{ color: '#999', marginTop: 8 }}>
              No puedes cancelar mientras la otra parte gestiona la contratación.
            </p>
          )}
        </section>
      )}

      {/* MODAL CANCELACIÓN */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              maxWidth: 500,
              width: '100%',
            }}
          >
            <h2>Cancelar actuación</h2>

            <p>
              Al cancelar, el caso quedará pendiente de revisión.
              No implica devolución automática.
            </p>

            <textarea
              placeholder="Motivo de la cancelación"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: '100%', minHeight: 80 }}
            />

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                disabled={!cancelReason || isCancelling}
                onClick={async () => {
                  setIsCancelling(true);
                  try {
                    await fetch(
                      `${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings/${booking.id}/cancel`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${user?.token}`,
                        },
                        body: JSON.stringify({
                          reason:
                            user?.role === 'ARTIST'
                              ? 'ARTIST_JUSTIFIED'
                              : 'VENUE',
                          description: cancelReason,
                        }),
                      },
                    );
                    setShowCancelModal(false);
                  } finally {
                    setIsCancelling(false);
                  }
                }}
              >
                Confirmar cancelación
              </button>

              <button onClick={() => setShowCancelModal(false)}>
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
