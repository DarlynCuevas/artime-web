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


import { confirmPaymentForMilestone } from "@/services/bookings/payments/confirmPayment.service";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { createPaymentIntentForMilestone, getMilestonesForBooking } from "@/services/bookings/payments/payments.service.";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const bookingId = typeof id === 'string' ? id : undefined;

  const {
    booking,
    loading,
    isHandledByOther,
    refresh,
  } = useBooking(bookingId);

  const { contract, refresh: refreshContract } = useContract(bookingId);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [milestoneId, setMilestoneId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (loading) return <p style={{ padding: 24 }}>Cargando contratación…</p>;
  if (!booking) return <p>No se pudo cargar la contratación.</p>;

  const hasContract = Boolean(contract);

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 32 }}>
        <h1>Contratación</h1>
        <p>Estado actual de la actuación y negociación asociada.</p>
      </header>

      {/* DATOS BOOKING */}
      <section style={{ border: '1px solid #ddd', padding: 16, marginBottom: 32 }}>
        <p><strong>ID:</strong> {booking.id}</p>
        <p><strong>Fecha:</strong> {booking.start_date}</p>
        <p><strong>Importe:</strong> {booking.totalAmount} €</p>
        <p><strong>Estado:</strong> {booking.status}</p>
      </section>

      {/* NEGOCIACIÓN */}
      {!hasContract && (
        <NegotiationPanel
          bookingId={booking.id}
          isHandledByOther={isHandledByOther}
          bookingStatus={booking.status}
          userRole={user?.role as UserRole}
          onBookingUpdated={refresh}
          refreshContract={refreshContract}
        />
      )}

      {/* FIRMAR CONTRATO / ESPERA FIRMA */}

      {booking.status === 'ACCEPTED' && contract?.status === 'DRAFT' && (
        <>
          {(user.role === 'ARTIST' || user.role === 'MANAGER') && (
            <button
              disabled={isSigning}
              onClick={async () => {
                setIsSigning(true);
                await signContract(contract.id, user.token);
                await refresh();
                await refreshContract();
                setIsSigning(false);
              }}
            >
              Firmar contrato
            </button>
          )}

          {(user.role === 'VENUE' || user.role === 'PROMOTER') && (
            <p style={{ marginTop: 12 }}>
              Contrato enviado, pendiente de firma del artista
            </p>
          )}
        </>
      )}


      {/* PAGO */}
      {booking.status === 'CONTRACT_SIGNED' &&
        (user?.role === 'VENUE' || user?.role === 'PROMOTER') && (
          <section style={{ marginTop: 32, border: '1px solid #ddd', padding: 16 }}>
            <h2>Pago de la actuación</h2>

            {!clientSecret && (
              <button
                onClick={async () => {
                  try {
                    const milestones = await getMilestonesForBooking(
                      booking.id,
                      user.token
                    );

                    const pending = milestones.find(
                      (m: any) => m.props?.status === 'PENDING'
                    );
                    console.log('Milestone pendiente:', pending);

                    if (!pending) {
                      setPaymentError('No hay milestones pendientes');
                      return;
                    }

                    const milestoneId = pending.props?.id;
                    const result = await createPaymentIntentForMilestone(
                      milestoneId,
                      user.token
                    );
                    const { clientSecret } = result;

                    setMilestoneId(pending.props.id);
                    setClientSecret(clientSecret);
                  } catch (e) {
                    setPaymentError('No se pudo preparar el pago');
                    console.error('Error en el flujo de pago:', e);
                  }
                }}
              >
                Proceder al pago
              </button>
            )}

            {(() => {
              if (clientSecret && milestoneId) {
                return (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SimpleCardPaymentForm
                      clientSecret={clientSecret}
                      bookingId={booking.id}
                      milestoneId={milestoneId}
                      token={user.token}
                      onSuccess={async () => {
                        await refresh();
                      }}
                    />
                  </Elements>
                );
              }
              return null;
            })()}

            {paymentError && <p>{paymentError}</p>}
          </section>
        )}

      {/* ACEPTAR CONDICIONES */}
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
        </section>
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
        title="Cancelar booking"
        confirmLabel="Cancelar booking"
        onClose={() => setShowCancelModal(false)}
        onConfirm={async ({ reason, description }) => {
          await cancelBooking({
            bookingId: booking.id,
            reason,
            description,
            token: user.token,
            initiator: user.role as any,
          });
          await refresh();
        }}
      />
    </main>
  );
}

/* =========================
   FORMULARIO STRIPE LIMPIO
   ========================= */

function SimpleCardPaymentForm({
  clientSecret,
  bookingId,
  milestoneId,
  token,
  onSuccess,
}: {
  clientSecret: string;
  bookingId: string;
  milestoneId: string;
  token: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message ?? 'Pago fallido');
      setLoading(false);
      return;
    }

    if (result.paymentIntent?.status === 'succeeded') {
      await confirmPaymentForMilestone({
        bookingId,
        milestoneId,
        token,
      });

      onSuccess();
    }

    setLoading(false);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <PaymentElement />
      {error && <p>{error}</p>}
      <button onClick={handlePay} disabled={loading}>
        {loading ? 'Procesando…' : 'Pagar'}
      </button>
    </div>
  );
}
