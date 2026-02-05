import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { AlertTriangle, Calendar, CheckCircle2, Euro, Loader2, MessageSquare, Sparkles, User, Clock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/hooks/auth/useAuth';
import { createBooking } from '@/services/bookings/bookings.service';
import { getArtists } from '@/services/artists/artists.service';
import { useMe } from '@/hooks/auth/useMe';
import { withRole } from '@/components/auth/withRole';

function NewBookingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { artistId: artistIdFromQuery, date: dateFromQuery, eventId: eventIdFromQuery } = router.query as {
    artistId?: string;
    date?: string;
    eventId?: string;
  };

  const [artists, setArtists] = useState<any[]>([]);
  const [artistId, setArtistId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [amount, setAmount] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [message, setMessage] = useState(
    `Esta propuesta define las condiciones iniciales de la contratación.

El contenido y el importe quedarán registrados en ARTIME como base de la negociación.`
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
      .catch(() => {
        setError('No se pudieron cargar los artistas');
      });
  }, [user?.token]);

  useEffect(() => {
    if (artistIdFromQuery && typeof artistIdFromQuery === 'string') {
      setArtistId(artistIdFromQuery);
    }

    if (dateFromQuery && typeof dateFromQuery === 'string') {
      setStartDate(dateFromQuery);
    }
  }, [artistIdFromQuery, dateFromQuery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.token) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuggestions([]);

      const booking = await createBooking(
        {
          artistId,
          start_date: startDate,
          totalAmount: Number(amount),
          currency: 'EUR',
          message,
          eventId: eventIdFromQuery,
        },
        user.token
      );

      router.push(`/bookings/${booking.id}`);
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err?.message ?? '{}');
        if (parsed?.message === 'DATE_NOT_AVAILABLE') {
          setError(parsed.reason === 'BOOKING_CONFLICT'
            ? 'La fecha ya tiene un booking confirmado.'
            : 'La fecha está bloqueada por el artista.');
          setSuggestions(parsed.suggestions ?? []);
          return;
        }
      } catch (parseErr) {
        // ignore JSON parse errors
      }

      setError('No se pudo crear la propuesta');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 animate-pulse font-medium text-sm">
          <Clock className="h-4 w-4" />
          <span>Iniciando generador de propuestas...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
      <Link href="/venues/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">
        <ChevronLeft className="h-4 w-4" />
        Volver al dashboard
      </Link>

      <header className="border-b border-slate-100 pb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-900" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Artime OS · Booking Generator</p>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Crear propuesta de contratación</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Define las condiciones base de la operación. Esta propuesta iniciará el flujo formal de negociación en ARTIME.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-8">
            <Card title="Condiciones" icon={<Calendar className="h-4 w-4" />}>
              <div className="space-y-6">
                <Field label="Artista objetivo">
                  {artistIdFromQuery ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="size-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                        <User className="size-4 text-slate-400" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-900">Artista preseleccionado</span>
                    </div>
                  ) : (
                    <select
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none appearance-none"
                      value={artistId}
                      onChange={(e) => setArtistId(e.target.value)}
                      required
                    >
                      <option value="">Seleccionar artista del roster...</option>
                      {artists.map((artist) => (
                        <option key={artist.id} value={artist.id}>
                          {artist.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>

                <div className="grid grid-cols-1 gap-6">
                  <Field label="Fecha de la actuación" helper={dateFromQuery ? 'Bloqueada desde perfil' : undefined}>
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        disabled={!!dateFromQuery}
                        className="w-full h-11 pl-4 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>
                  </Field>

                  <Field label="Oferta económica inicial" helper="Importe neto (sin IVA)">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Euro className="h-4 w-4 text-slate-400 group-focus-within:text-slate-900" />
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        placeholder="0.00"
                        className="w-full h-11 pl-10 pr-12 rounded-xl border border-slate-200 bg-white text-[15px] font-bold tabular-nums text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
                      />
                      <div className="absolute inset-y-0 right-4 flex items-center text-[10px] font-black text-slate-300 uppercase">
                        EUR
                      </div>
                    </div>
                  </Field>
                </div>
              </div>
            </Card>

            <Card title="Garantías" icon={<Sparkles className="h-4 w-4" />}>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                 <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-4 text-emerald-600 mt-0.5" />
                  <p className="text-[12px] text-slate-600 font-medium leading-relaxed">
                    Al emitir esta propuesta, se crea un registro inmutable en el sistema de auditoría de ARTIME.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-4 text-emerald-600 mt-0.5" />
                  <p className="text-[12px] text-slate-600 font-medium leading-relaxed">
                    Ambas partes podrán negociar términos adicionales de forma segura.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card
              title="Memorándum de la propuesta"
              subtitle="Notas operativas y contexto adicional"
              icon={<MessageSquare className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe brevemente el contexto del evento, necesidades técnicas o cualquier observación relevante..."
                  className="w-full min-h-[360px] p-6 rounded-2xl border border-slate-200 bg-white text-[14px] font-medium leading-relaxed placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none resize-none shadow-inner bg-slate-50/20"
                />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Este texto se integrará como nota oficial en la trazabilidad del booking.</p>
              </div>
            </Card>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[13px] font-black text-red-900 uppercase tracking-tight">Error de validación</p>
              <p className="text-[13px] text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                <Calendar className="size-4 text-amber-600" />
              </div>
              <p className="text-[13px] font-black text-amber-900 uppercase tracking-tight">Disponibilidad sugerida</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setStartDate(d)}
                  className="h-10 px-4 rounded-xl border border-amber-200 bg-white text-[12px] font-bold text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-all shadow-sm"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-14 inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-900 text-white text-[15px] font-black hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-900/10 group"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
            )}
            {submitting ? 'Emitiendo propuesta oficial...' : 'Confirmar y enviar propuesta operativa'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default withRole(NewBookingPage, ['VENUE', 'PROMOTER']);

function Card({ title, subtitle, icon, className, children }: { title: string; subtitle?: string; icon?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className ?? ''}`}>
      <header className="px-6 py-6 border-b border-slate-50 bg-white flex items-center gap-4">
        <div className="size-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h2>
          {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">{subtitle}</p>}
        </div>
      </header>
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</label>
        {helper && <span className="text-[10px] font-bold text-slate-400 italic">{helper}</span>}
      </div>
      {children}
    </div>
  );
}
