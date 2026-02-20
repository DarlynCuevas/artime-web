import { useState } from 'react';
import { useNegotiation } from '@/hooks/bookings/useNegotiation';
import type { UserRole } from '@/types/user-role';
import { useAuth } from '@/hooks/auth/useAuth';
import { acceptFinalOffer } from '@/services/bookings/negotiations.service';
import { acceptBooking } from '@/services/bookings/bookings.service';
import {
  isArtistSideRole,
  isVenueSideRole,
  isMyTurnByLastMessage,
  isArtistSideOwnerLocked,
} from '@/components/bookings/booking-turns';

type Props = {
  bookingId: string;
  bookingStatus: string;
  userRole: UserRole;
  handledByRole?: UserRole | null;
  handledByUserId?: string | null;
  onBookingUpdated: () => void;
  refreshContract: () => void;
  onCancelBooking: () => void;
};

export function NegotiationPanel({
  bookingId,
  userRole,
  bookingStatus,
  handledByRole,
  handledByUserId,
  onBookingUpdated,
  refreshContract,
  onCancelBooking,
}: Props) {
  const isClosed = [
    'ACCEPTED',
    'PAID_PARTIAL',
    'PAID_FULL',
    'COMPLETED',
    'CANCELLED',
    'CANCELLED_PENDING_REVIEW',
    'REJECTED',
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

  const isArtistSide = isArtistSideRole(userRole);
  const isVenueSide = isVenueSideRole(userRole);

  const lastSenderRole = lastMessage?.senderRole as UserRole | undefined;
  const isMyTurnByMessages = isMyTurnByLastMessage({
    lastSenderRole,
    currentRole: userRole,
  });

  // Bloqueo solo dentro del lado artista/manager (dueño del booking).
  const isOwnerLocked = isArtistSideOwnerLocked({
    currentRole: userRole,
    currentUserId: user?.id,
    ownerRole: handledByRole ?? null,
    ownerUserId: handledByUserId ?? null,
  });
  const isMyTurn = isOwnerLocked ? false : isMyTurnByMessages;

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
    <section className="mt-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Negociación</h2>
        {sending && <span className="text-xs text-slate-500">Enviando…</span>}
      </div>

      <section className="space-y-2">
        {loading && <p className="text-sm text-slate-500">Cargando negociación…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!canWrite && !canAcceptOrReject && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            La negociación está pendiente de acción de la otra parte.
          </div>
        )}
      </section>

      {canWrite && (
        <section className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            placeholder="Mensaje opcional"
            className="w-full min-h-[90px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">Importe (€)</label>
            <input
              type="number"
              placeholder="0,00"
              value={fee}
              onChange={(e) =>
                setFee(e.target.value ? Number(e.target.value) : '')
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
            />
            {needsFee && (
              <p className="text-xs text-red-600">
                Es necesario indicar un importe válido.
              </p>
            )}
          </div>

          {canMarkAsFinalOffer && (
            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={isFinalOffer}
                onChange={(e) => setIsFinalOffer(e.target.checked)}
                className="h-4 w-4"
              />
              Marcar como oferta final
            </label>
          )}

          <div className="flex items-center gap-3">
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
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Enviar propuesta
            </button>
          </div>
        </section>
      )}

      {canAcceptOrReject && (
        <section className="flex items-center gap-3">
          <button
            type="button"
            disabled={sending}
            onClick={async () => {
              if (bookingStatus === 'FINAL_OFFER_SENT') {
                await acceptFinalOffer(bookingId, user?.token);
              } else if (bookingStatus === 'PENDING' || bookingStatus === 'NEGOTIATING') {
                await acceptBooking(bookingId, user?.token);
              }

              onBookingUpdated();
              refreshContract();
            }}
            className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
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
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Rechazar
          </button>
        </section>
      )}

      {!canWrite && !canAcceptOrReject && !['CANCELLED', 'CANCELLED_PENDING_REVIEW'].includes(bookingStatus) && (
        <section>
          <button
            type="button"
            disabled={sending}
            onClick={onCancelBooking}
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar booking
          </button>
        </section>
      )}
    </section>
  );
}
