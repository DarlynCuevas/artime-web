import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { AlertTriangle, Calendar, CheckCircle2, Euro, Loader2, MessageSquare, Sparkles, UserCircle2, Info } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { createBooking } from '@/services/bookings/bookings.service';
import { getArtistProfileById, getArtists } from '@/services/artists/artists.service';
import { useMe } from '@/hooks/auth/useMe';
import { withRole } from '@/components/auth/withRole';
import { formatCurrency } from '@/lib/utils';
import { normalizeArtistBookingConditions } from '@/types/artists/booking-conditions';
import type { ArtistBookingConditions } from '@/types/artists/booking-conditions';

type ArtistListItem = {
  id: string;
  name: string;
};

type ArtistProfileLite = {
  basePrice?: number | null;
  base_price?: number | null;
  currency?: string | null;
  isNegotiable?: boolean | null;
  is_negotiable?: boolean | null;
  bookingConditions?: Partial<ArtistBookingConditions> | null;
};

function NewBookingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { artistId: artistIdFromQuery, date: dateFromQuery, eventId: eventIdFromQuery } = router.query as {
    artistId?: string;
    date?: string;
    eventId?: string;
  };

  const [artists, setArtists] = useState<ArtistListItem[]>([]);
  const [artistId, setArtistId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedArtistProfile, setSelectedArtistProfile] = useState<ArtistProfileLite | null>(null);
  const [loadingArtistProfile, setLoadingArtistProfile] = useState(false);
  const [allIn, setAllIn] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [message, setMessage] = useState(
    `Esta propuesta define las condiciones iniciales de la contratación.\n\nEl contenido y el importe quedarán registrados en ARTIME como base de la negociación.`
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { role, loading: meLoading } = useMe();
  const canCreateBooking = role === 'VENUE' || role === 'PROMOTER';

  useEffect(() => {
    if (!user) return;
    if (meLoading) return;
    if (!role) return;
    if (!canCreateBooking) {
      router.replace('/');
    }
  }, [user, meLoading, canCreateBooking, router, role]);

  useEffect(() => {
    if (!user?.token) return;
    getArtists(user.token)
      .then(setArtists)
      .catch(() => setError('No se pudieron cargar los artistas.'));
  }, [user?.token]);

  useEffect(() => {
    if (artistIdFromQuery && typeof artistIdFromQuery === 'string') {
      setArtistId(artistIdFromQuery);
    }
    if (dateFromQuery && typeof dateFromQuery === 'string') {
      setStartDate(dateFromQuery);
    }
  }, [artistIdFromQuery, dateFromQuery]);

  useEffect(() => {
    if (!user?.token) return;
    if (!artistId) {
      setSelectedArtistProfile(null);
      return;
    }

    let cancelled = false;
    setLoadingArtistProfile(true);
    getArtistProfileById(artistId, user.token)
      .then((profile) => {
        if (cancelled) return;
        setSelectedArtistProfile(profile);

        const basePrice = Number(profile?.basePrice ?? profile?.base_price);
        const isNegotiable = profile?.isNegotiable ?? profile?.is_negotiable;
        const isNonNegotiable = isNegotiable === false;

        if (Number.isFinite(basePrice) && basePrice >= 0) {
          // Always force base price when the artist is non-negotiable.
          // For negotiable artists, only prefill if the user hasn't typed anything yet.
          if (isNonNegotiable || !amount) {
            setAmount(String(basePrice));
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSelectedArtistProfile(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingArtistProfile(false);
      });

    return () => {
      cancelled = true;
    };
    // amount is intentionally omitted: we only want to prefill on artist changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId, user?.token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.token) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuggestions([]);

      const isNegotiable = selectedArtistProfile?.isNegotiable ?? selectedArtistProfile?.is_negotiable;
      const isNonNegotiable = isNegotiable === false;
      const basePrice = Number(selectedArtistProfile?.basePrice ?? selectedArtistProfile?.base_price);
      const resolvedAmount = isNonNegotiable && Number.isFinite(basePrice) ? basePrice : Number(amount);
      const artistConditionsSnapshot = normalizeArtistBookingConditions(selectedArtistProfile?.bookingConditions ?? null);

      const booking = await createBooking(
        {
          artistId,
          start_date: startDate,
          totalAmount: resolvedAmount,
          allIn,
          artistConditionsSnapshot,
          currency: 'EUR',
          message,
          eventId: eventIdFromQuery,
        },
        user.token
      );

      router.push(`/bookings/${booking.id}`);
    } catch (err: unknown) {
      try {
        const parsed = JSON.parse(err instanceof Error ? err.message : '{}');
        if (parsed?.message === 'DATE_NOT_AVAILABLE') {
          setError(parsed.reason === 'BOOKING_CONFLICT'
            ? 'La fecha ya tiene una contratación confirmada.'
            : 'La fecha está bloqueada por el artista.');
          setSuggestions(parsed.suggestions ?? []);
          return;
        }
      } catch {
        // ignore JSON parse errors
      }
      setError('No se pudo crear la propuesta. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user || meLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pb-24">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center animate-pulse mb-4">
          <Calendar className="w-6 h-6 text-amber-500" />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preparando…</p>
      </div>
    );
  }

  const selectedArtistName = artistId ? artists.find(a => a.id === artistId)?.name || 'Artista' : null;
  const selectedArtistIsNegotiable = selectedArtistProfile?.isNegotiable ?? selectedArtistProfile?.is_negotiable;
  const selectedArtistIsNonNegotiable = selectedArtistIsNegotiable === false;
  const selectedArtistBasePrice = Number(selectedArtistProfile?.basePrice ?? selectedArtistProfile?.base_price);
  const selectedArtistCurrency = String(selectedArtistProfile?.currency ?? 'EUR');
  const selectedArtistBasePriceLabel =
    Number.isFinite(selectedArtistBasePrice) ? formatCurrency(selectedArtistBasePrice, selectedArtistCurrency) : null;
  const selectedArtistConditions = normalizeArtistBookingConditions(selectedArtistProfile?.bookingConditions ?? null);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-fintech-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-24">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-brand-amber" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-1">Nueva contratación</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Crear propuesta</h1>
            </div>
          </div>
          <p className="text-white/60 text-sm max-w-xl pl-16">
            Define las condiciones base y establece el contexto de la nueva contratación. Esta propuesta formaliza el inicio de las negociaciones en ARTIME.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* PANEL PRINCIPAL: CONDICIONES */}
            <div className="lg:col-span-1 space-y-6">
              <Card title="Condiciones base" icon={<Calendar className="h-4 w-4 text-amber-600" />} tone="amber">
                <div className="space-y-5">
                  <Field label="Artista">
                    {artistIdFromQuery ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <UserCircle2 className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{selectedArtistName ?? 'Seleccionado desde perfil'}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Seleccionado</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <UserCircle2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                          className="w-full pl-9 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all appearance-none"
                          value={artistId}
                          onChange={(e) => setArtistId(e.target.value)}
                          required
                        >
                          <option value="" disabled>Selecciona un artista…</option>
                          {artists.map((artist) => (
                            <option key={artist.id} value={artist.id}>
                              {artist.name}
                            </option>
                          ))}
                        </select>
                        {/* Custom Select Arrow */}
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    )}
                  </Field>

                  <Field label="Fecha de la actuación" helper={dateFromQuery ? 'Fijada en el perfil' : 'Día del evento'}>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      disabled={!!dateFromQuery}
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all disabled:opacity-60 disabled:bg-slate-50"
                    />
                  </Field>

                  <Field label="Caché inicial propuesto" helper="Importe exacto sin impuestos">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Euro className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        placeholder="Ej. 1500"
                        disabled={selectedArtistIsNonNegotiable || loadingArtistProfile}
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all placeholder:text-slate-300 disabled:opacity-70 disabled:bg-slate-50"
                      />
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">EUR</span>
                      </div>
                    </div>

                    {selectedArtistIsNonNegotiable ? (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Info className="h-4 w-4 text-amber-700" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-900">Caché no negociable</p>
                            <p className="mt-1 text-xs text-amber-900/90 leading-relaxed">
                              Este artista trabaja con caché fijo{selectedArtistBasePriceLabel ? ` (${selectedArtistBasePriceLabel})` : ''}. El importe no se puede modificar al iniciar el booking.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </Field>

                  <Field label="Modalidad de contratación">
                    <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 cursor-pointer">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900">All-in</p>
                        <p className="text-xs text-slate-500">Importe total cerrado (caché + gastos)</p>
                      </div>
                      <div className="relative shrink-0">
                        <input
                          type="checkbox"
                          checked={allIn}
                          onChange={(e) => setAllIn(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-amber-500 transition-colors duration-300" />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform duration-300" />
                      </div>
                    </label>

                    {allIn ? (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-4 w-4 text-amber-700" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-900">All-in activado</p>
                            <p className="mt-1 text-xs text-amber-900/90 leading-relaxed">
                              El artista asume la gestión de gastos. El importe se negocia como total cerrado.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </Field>

                  <Field label="Condiciones del artista" helper="No negociables">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        El contratante acepta estas condiciones si continúa
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <ConditionPill label="Crew" value={selectedArtistConditions.crewSize ? `${selectedArtistConditions.crewSize} pax` : 'No definido'} />
                        <ConditionPill label="Habitaciones" value={selectedArtistConditions.hotelRooms ? `${selectedArtistConditions.hotelRooms}` : 'No definido'} />
                        <ConditionPill label="Noches" value={selectedArtistConditions.hotelNights ? `${selectedArtistConditions.hotelNights}` : 'No definido'} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <ConditionPill label="Vuelos" value={selectedArtistConditions.requiresFlights ? 'Requerido' : 'No requerido'} />
                        <ConditionPill label="Transporte local" value={selectedArtistConditions.requiresGroundTransport ? 'Requerido' : 'No requerido'} />
                      </div>
                      {selectedArtistConditions.hospitalityNotes ? (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hospitality</p>
                          <p className="mt-1 text-xs text-slate-700 leading-relaxed">{selectedArtistConditions.hospitalityNotes}</p>
                        </div>
                      ) : null}
                      {selectedArtistConditions.technicalNotes ? (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Técnico</p>
                          <p className="mt-1 text-xs text-slate-700 leading-relaxed">{selectedArtistConditions.technicalNotes}</p>
                        </div>
                      ) : null}
                      {selectedArtistConditions.additionalNotes ? (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Adicional</p>
                          <p className="mt-1 text-xs text-slate-700 leading-relaxed">{selectedArtistConditions.additionalNotes}</p>
                        </div>
                      ) : null}
                    </div>
                  </Field>
                </div>
              </Card>

              {/* ERRORES Y SUGERENCIAS */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-800 mb-0.5">Conflicto de fecha</p>
                      <p className="text-xs font-medium text-red-900 leading-relaxed">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <p className="text-xs font-black uppercase tracking-widest text-amber-900">Fechas alternativas disponibles</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => { setStartDate(d); setError(null); setSuggestions([]); }}
                        className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors shadow-sm"
                      >
                        {formatDateDisplay(d)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PANEL SECUNDARIO: MENSAJE E INFO */}
            <div className="lg:col-span-2 space-y-6">
              <Card
                title="Mensaje inicial y requerimientos"
                icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
                tone="blue"
              >
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 mb-2">
                    Explica los detalles clave del evento: <strong className="text-slate-700">horarios, rider técnico, pruebas de sonido, alojamiento u otros gastos cubiertos.</strong>
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={10}
                    required
                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all resize-y"
                  />
                </div>
              </Card>

              {/* DISCLAIMER Y BOTÓN DE ACCIÓN */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="rounded-full bg-slate-100 p-2 shrink-0">
                    <Info className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Confirmación legal</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Al enviar esta propuesta se genera un booking inicial vinculante para el inicio de las negociaciones, visible para el representante o el artista. Las condiciones económicas y logísticas se podrán debatir a continuación.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  <button
                    type="submit"
                    disabled={submitting || !artistId || !startDate || !amount}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-amber text-amber-950 px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)] disabled:opacity-50 disabled:shadow-none disabled:hover:bg-brand-amber cursor-pointer disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-900" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-amber-700" />
                    )}
                    {submitting ? 'Enviando…' : 'Enviar Propuesta'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}

export default withRole(NewBookingPage, ['VENUE', 'PROMOTER']);

// ── Components ──────────────────────────────────────────────────

function Card({ title, icon, tone = 'slate', children }: { title: string; icon?: ReactNode; tone?: 'slate' | 'amber' | 'blue'; children: ReactNode }) {
  const iconBgClass =
    tone === 'amber' ? 'bg-amber-50' :
      tone === 'blue' ? 'bg-blue-50' :
        'bg-slate-100';

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
        {icon && (
          <div className={`w-8 h-8 rounded-xl ${iconBgClass} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
        )}
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </label>
        {helper && <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 text-right">{helper}</span>}
      </div>
      {children}
    </div>
  );
}

function ConditionPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function formatDateDisplay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
