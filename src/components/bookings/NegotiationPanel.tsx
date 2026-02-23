import { useEffect, useState } from 'react';
import { useNegotiation } from '@/hooks/bookings/useNegotiation';
import type { UserRole } from '@/types/user-role';
import { useAuth } from '@/hooks/auth/useAuth';
import { acceptFinalOffer } from '@/services/bookings/negotiations.service';
import { acceptBooking } from '@/services/bookings/bookings.service';
import { Info } from 'lucide-react';
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
  const [allIn, setAllIn] = useState(false);

  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;
  const lastAllIn = messages.length > 0 ? (messages[messages.length - 1]?.allIn ?? false) : false;

  useEffect(() => {
    // Default the toggle to the latest offer context when messages load/change.
    setAllIn(lastAllIn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

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

  if (isClosed) {
    return null;
  }

  return (
    <section className="mt-6 space-y-5">
      {(canWrite || canAcceptOrReject) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
            <h2 className="text-base font-black text-slate-900 uppercase tracking-widest italic">Negociación</h2>
          </div>
          {sending && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg animate-pulse">
              Enviando…
            </div>
          )}
        </div>
      )}

      <section className="space-y-2">
        {loading && <p className="text-sm text-slate-500">Cargando negociación…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      {canWrite && (
        <section className="space-y-5 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Tu mensaje</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sending}
              placeholder="Escribe una nota para la otra parte (ej. condiciones adicionales, detalles del set...)"
              className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 focus:outline-none transition-all duration-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Importe propuesto</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300 group-focus-within:text-amber-500 transition-colors">€</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={fee}
                  onChange={(e) =>
                    setFee(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-3.5 text-xl font-black text-slate-900 tabular-nums focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 focus:outline-none transition-all duration-300"
                />
              </div>
              {needsFee && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1 animate-pulse">
                  Indica un importe para continuar
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    All-in
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                    <Info className="h-3 w-3" />
                    El artista gestiona gastos
                  </span>
                </div>
                <div className="relative shrink-0">
                  <input
                    type="checkbox"
                    checked={allIn}
                    onChange={(e) => setAllIn(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-amber-500 transition-colors duration-300" />
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-5 transition-transform duration-300" />
                </div>
              </label>

              {canMarkAsFinalOffer && (
                <label className="flex items-center gap-2.5 cursor-pointer group px-1">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isFinalOffer}
                      onChange={(e) => setIsFinalOffer(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-orange-500 transition-colors duration-300" />
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-5 transition-transform duration-300" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-orange-600 transition-colors">Marcar como oferta final</span>
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
                      allIn,
                    });
                  } else {
                    await sendMessage({
                      message: text || '',
                      proposedFee: parsedFee,
                      allIn,
                    });
                  }

                  await onBookingUpdated();
                  setText('');
                  setFee('');
                  setIsFinalOffer(false);
                }}
                className="w-full h-12 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0 transition-all duration-300"
              >
                Enviar propuesta
              </button>
            </div>
          </div>
        </section>
      )}

      {canAcceptOrReject && (
        <section className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4">
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest text-center sm:text-left">
            Acción rápida
          </p>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="order-1 sm:order-2 flex items-center justify-center sm:justify-end gap-3 flex-wrap">
              <button
              type="button"
              disabled={sending}
              onClick={async () => {
                if (!user?.token) return;
                if (bookingStatus === 'FINAL_OFFER_SENT') {
                  await acceptFinalOffer(bookingId, user.token);
                } else if (bookingStatus === 'PENDING' || bookingStatus === 'NEGOTIATING') {
                  await acceptBooking(bookingId, user.token);
                }

                onBookingUpdated();
                refreshContract();
              }}
              className="h-10 w-full sm:w-auto px-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-[11px] font-black text-white uppercase tracking-widest shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 hover:shadow-xl transition-all duration-300"
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
              className="h-10 w-full sm:w-auto px-6 inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-widest hover:bg-slate-50 transition-all duration-300"
            >
              Rechazar
              </button>
            </div>

            <p className="order-2 sm:order-1 text-xs text-emerald-600 font-medium text-center sm:text-left">
              Has recibido una propuesta. ¿Cómo quieres proceder?
            </p>
          </div>
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
