import { NegotiationPanel } from "@/components/bookings/NegotiationPanel";
import { useContract } from '@/hooks/bookings/contracts/useContract';
import { useBooking } from "@/hooks/bookings/useBooking";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user-role";
import { useRouter } from "next/router";
import { useState } from "react";
import { acceptBooking } from '@/services/bookings/bookings.service';
import { signContract } from '@/services/contracts/contracts.service';
import { CancelBookingModal } from '@/components/bookings/CancelBookingModal';
import { cancelBooking } from "@/services/bookings/cancellations.service";
import { BookingStatus } from "@/types/booking";


export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const bookingId = typeof id === 'string' ? id : undefined;

  const {
    booking,
    loading,
    isHandledByMe,
    isHandledByOther,
    refresh,
  } = useBooking(bookingId);

  const { contract, refresh: refreshContract } = useContract(bookingId);

  if (loading) return <p style={{ padding: 24 }}>Cargando contratación…</p>;
  if (!booking) return <p>No se pudo cargar la contratación.</p>;

  const hasContract = Boolean(contract);

  const canCancelBooking =
    booking.status === 'FINAL_OFFER_SENT' ||
    booking.status === 'ACCEPTED' ||
    booking.status === 'CONTRACT_SIGNED';


  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

      <header style={{ marginBottom: 32 }}>
        <h1>Contratación</h1>
        <p>Estado actual de la actuación y negociación asociada.</p>
      </header>

      <section style={{ border: '1px solid #ddd', padding: 16, marginBottom: 32 }}>
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
      {!hasContract && (
        <section style={{ marginBottom: 32 }}>
          <NegotiationPanel
            bookingId={booking.id}
            isHandledByOther={isHandledByOther}
            bookingStatus={booking.status}
            userRole={user?.role as UserRole}
            onBookingUpdated={refresh}
            refreshContract={refreshContract}
          />
        </section>
      )}

      {/* ACEPTAR CONDICIONES Y CANCELAR */}
      {booking.status === 'FINAL_OFFER_SENT' && !hasContract && (
        <section style={{ marginBottom: 32, display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={() => setShowAcceptModal(true)}
            style={{
              padding: '10px 14px',
              background: '#000',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Aceptar condiciones
          </button>
          {canCancelBooking && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              style={{
                padding: '10px 14px',
                background: '#fff',
                border: '1px solid #000',
                cursor: 'pointer',
              }}
            >
              {(() => {
                // Forzamos el tipo para evitar el error de comparación de literales
                const status = booking.status as BookingStatus;
                return status === 'CONTRACT_SIGNED'
                  ? 'Anular contratación'
                  : 'Cancelar booking';
              })()}
            </button>
          )}
        </section>
      )}
      {/* Si se puede cancelar booking pero no está en FINAL_OFFER_SENT, mostrar el botón solo */}
      {canCancelBooking && !(booking.status === 'FINAL_OFFER_SENT' && !hasContract) && (
        <section style={{ marginBottom: 32 }}>
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            style={{
              padding: '10px 14px',
              background: '#fff',
              border: '1px solid #000',
              cursor: 'pointer',
            }}
          >
            {booking.status === 'CONTRACT_SIGNED'
              ? 'Anular contratación'
              : 'Cancelar booking'}
          </button>
        </section>
      )}



      {/* FIRMAR CONTRATO */}
      {booking.status === 'ACCEPTED' && contract?.status === 'DRAFT' && (
        <section style={{ marginBottom: 32 }}>
          <button
            disabled={isSigning}
            onClick={async () => {
              setIsSigning(true);
              try {
                await signContract(contract.id, user.token);
                await refresh();
                await refreshContract();
              } finally {
                setIsSigning(false);
              }
            }}
            style={{
              padding: '10px 14px',
              background: '#000',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Firmar contrato
          </button>
        </section>
      )}

      {booking.status === 'CONTRACT_SIGNED' && (
        <p><strong>Contrato firmado</strong></p>
      )}

      {/* MODAL ACEPTACIÓN */}
      {showAcceptModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ background: '#fff', padding: 24, maxWidth: 520 }}>
            <h2>Confirmar contratación</h2>

            <p>
              Estás a punto de confirmar esta actuación con las siguientes condiciones:
            </p>

            <ul>
              <li><strong>Fecha:</strong> {booking.start_date}</li>
              <li><strong>Importe:</strong> {booking.totalAmount} €</li>
              <li><strong>Moneda:</strong> {booking.currency}</li>
            </ul>

            <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
              <button
                disabled={isAccepting}
                onClick={async () => {
                  setIsAccepting(true);
                  try {
                    await acceptBooking(booking.id, user.token);
                    setShowAcceptModal(false);
                    await refresh();
                    await refreshContract();
                  } finally {
                    setIsAccepting(false);
                  }
                }}
                style={{
                  background: '#000',
                  color: '#fff',
                  padding: '8px 12px',
                  border: 'none',
                }}
              >
                Confirmar contratación
              </button>

              <button
                onClick={() => setShowAcceptModal(false)}
                disabled={isAccepting}
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      <CancelBookingModal
  open={showCancelModal}
  title={
    booking.status === 'CONTRACT_SIGNED'
      ? 'Anular contratación'
      : 'Cancelar booking'
  }
  confirmLabel={
    booking.status === 'CONTRACT_SIGNED'
      ? 'Anular contratación'
      : 'Cancelar booking'
  }
  onClose={() => setShowCancelModal(false)}
  onConfirm={async ({ reason, description }) => {
    await cancelBooking({
      bookingId: booking.id,
      reason,
      description,
      token: user.token,
      initiator: user.role as 'ARTIST' | 'VENUE' | 'PROMOTER' | 'SYSTEM',
    });
    await refresh();
  }}
/>

    </main>
    
  );
}
