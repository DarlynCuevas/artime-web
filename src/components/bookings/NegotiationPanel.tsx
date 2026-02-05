import { useState } from 'react';
import { useNegotiation } from '@/hooks/bookings/useNegotiation';
import type { UserRole } from '@/types/user-role';
import { useAuth } from '@/hooks/auth/useAuth';
import { acceptFinalOffer } from '@/services/bookings/negotiations.service';
import { acceptBooking } from '@/services/bookings/bookings.service';

type Props = {
  bookingId: string;
  isHandledByOther: boolean;
  bookingStatus: string;
  userRole: UserRole;
  handledByRole?: UserRole | null;
  onBookingUpdated: () => void;
  refreshContract: () => void;
  onCancelBooking: () => void;
};

export function NegotiationPanel({
  bookingId,
  isHandledByOther,
  userRole,
  bookingStatus,
  handledByRole,
  onBookingUpdated,
  refreshContract,
  onCancelBooking,
}: Props) {
  const isClosed = [
    'PAID_PARTIAL',
    'PAID_FULL',
    'COMPLETED',
    'CANCELLED',
    'CANCELLED_PENDING_REVIEW',
  ].includes(bookingStatus);
  if (isClosed) {
    return null;
  }

  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    sendOfferFinal,
    reject,
  } = useNegotiation(bookingId);

  const { user } = useAuth();

  const [text, setText] = useState('');
  const [fee, setFee] = useState<number | ''>('');
  const [isFinalOffer, setIsFinalOffer] = useState(false);

  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;

  const isArtistSide =
    userRole === 'ARTIST' || userRole === 'MANAGER';

  const isVenueSide =
    userRole === 'VENUE' || userRole === 'PROMOTER';

  const lastSenderRole = lastMessage?.senderRole as UserRole | undefined;
  const isLastFromArtistSide =
    lastSenderRole === 'ARTIST' || lastSenderRole === 'MANAGER';
  const isLastFromVenueSide =
    lastSenderRole === 'VENUE' || lastSenderRole === 'PROMOTER';

  const isMyTurnByMessages =
    !lastSenderRole
      ? true
      : isArtistSide
        ? isLastFromVenueSide
        : isLastFromArtistSide;

  // Si el backend define el turno, úsalo como fuente principal.
  const lockedToOther = handledByRole && handledByRole !== userRole;
  const isMyTurn = lockedToOther ? false : isMyTurnByMessages;

  const canWrite =
    ['PENDING', 'NEGOTIATING'].includes(bookingStatus) &&
    isMyTurn &&
    !(bookingStatus === 'PENDING' && isVenueSide);

  const parsedFee = Number(fee);
  const needsFee =
    !fee || isNaN(parsedFee) || parsedFee <= 0;

  const canMarkAsFinalOffer =
    isMyTurn &&
    (
      (isArtistSide &&
        ['PENDING', 'NEGOTIATING'].includes(bookingStatus)) ||
      (isVenueSide && bookingStatus === 'NEGOTIATING')
    );

  const canAcceptOrReject =
    ['PENDING', 'NEGOTIATING', 'FINAL_OFFER_SENT'].includes(bookingStatus) &&
    isMyTurn &&
    !(bookingStatus === 'PENDING' && isVenueSide);

  return (
    <section style={{ marginTop: 32 }}>
      <h2>Negociación</h2>

      {/* 1️⃣ ESTADO DE NEGOCIACIÓN */}
      <section style={{ marginBottom: 16 }}>
        {loading && <p>Cargando negociación…</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!canWrite && !canAcceptOrReject && (
          <p style={{ color: '#666' }}>
            La negociación está pendiente de acción de la otra
            parte.
          </p>
        )}
      </section>

      {/* 3️⃣ ENVÍO DE PROPUESTA */}
      {canWrite && (
        <section style={{ marginBottom: 24 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            placeholder="Mensaje opcional"
            style={{
              width: '100%',
              minHeight: 80,
              marginBottom: 8,
            }}
          />

          <input
            type="number"
            placeholder="Importe (€)"
            value={fee}
            onChange={(e) =>
              setFee(e.target.value ? Number(e.target.value) : '')
            }
            style={{ width: '100%', marginBottom: 4 }}
          />

          {needsFee && (
            <p style={{ color: '#b00020', fontSize: 13 }}>
              Es necesario indicar un importe válido.
            </p>
          )}

          {canMarkAsFinalOffer && (
            <label style={{ display: 'block', marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={isFinalOffer}
                onChange={(e) => setIsFinalOffer(e.target.checked)}
              />{' '}
              Marcar como oferta final
            </label>
          )}

          <button
            type="button"
            disabled={sending || needsFee}
            onClick={async () => {
              if (needsFee) return;

              if (isFinalOffer) {
                await sendOfferFinal({
                  proposedFee: parsedFee,
                  message: text || '',
                });
              } else {
                await sendMessage({
                  message: text || '',
                  proposedFee: parsedFee,
                });
              }

              await onBookingUpdated();
              setText('');
              setFee('');
              setIsFinalOffer(false);
            }}
          >
            Enviar propuesta
          </button>
        </section>
      )}

      {/* 4️⃣ DECISIÓN CONTRACTUAL */}
      {canAcceptOrReject && (
        <section>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              disabled={sending}
              onClick={async () => {
                if (bookingStatus === 'FINAL_OFFER_SENT') {
                  await acceptFinalOffer(bookingId, user?.token);
                } else if (bookingStatus === 'PENDING') {
                  await acceptBooking(bookingId, user?.token);
                }

                onBookingUpdated();
                refreshContract();
              }}
            >
              Aceptar
            </button>

            <button
              type="button"
              disabled={sending}
              onClick={async () => {
                await reject(bookingStatus);
                onBookingUpdated();
              }}
            >
              Rechazar
            </button>
          </div>
        </section>
      )}

      {!canWrite && !canAcceptOrReject && !['CANCELLED', 'CANCELLED_PENDING_REVIEW'].includes(bookingStatus) && (
        <section style={{ marginTop: 16 }}>
          <button
            type="button"
            disabled={sending}
            onClick={onCancelBooking}
          >
            Cancelar booking
          </button>
        </section>
      )}
    </section>
  );
}
