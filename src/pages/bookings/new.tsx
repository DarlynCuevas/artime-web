import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { AlertTriangle, Calendar, CheckCircle2, Euro, Loader2, MessageSquare, Sparkles } from 'lucide-react';

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

  // Carga de artistas
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
    return <div className="p-8 text-slate-700">Cargando…</div>;
  }

  return (
    <main className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Nueva contratación</p>
        <h1 className="text-3xl font-semibold text-slate-900">Crear propuesta de booking</h1>
        <p className="text-slate-600 max-w-3xl">
          Define condiciones base y deja claro el contexto. Esta propuesta inicia la negociación formal en ARTIME.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Condiciones iniciales" icon={<Calendar className="h-4 w-4 text-slate-600" />}>
            <div className="space-y-4">
              <Field label="Artista">
                {artistIdFromQuery ? (
                  <div className="text-sm text-slate-800">Artista preseleccionado desde el perfil</div>
                ) : (
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    value={artistId}
                    onChange={(e) => setArtistId(e.target.value)}
                    required
                  >
                    <option value="">Selecciona un artista</option>
                    {artists.map((artist) => (
                      <option key={artist.id} value={artist.id}>
                        {artist.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Fecha de la actuación" helper={dateFromQuery ? 'Fijada desde el perfil' : undefined}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    disabled={!!dateFromQuery}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                  />
                </Field>

                <Field label="Importe total" helper="Se registra como oferta inicial">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                    <Euro className="h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">EUR</span>
                  </div>
                </Field>
              </div>
            </div>
          </Card>

          <Card
            title="Mensaje inicial"
            icon={<MessageSquare className="h-4 w-4 text-slate-600" />}
            className="lg:col-span-2"
          >
            <div className="space-y-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
              <p className="text-xs text-slate-500">Queda registrado y complementa las condiciones numéricas.</p>
            </div>
          </Card>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-2">
            <div className="font-semibold">Fechas sugeridas cercanas</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setStartDate(d)}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <Card title="Confirmación" icon={<Sparkles className="h-4 w-4 text-slate-600" />}>
          <p className="text-sm text-slate-600">
            Al enviar esta propuesta se crea un booking en estado inicial, visible para ambas partes. Podrás negociar y modificar después.
          </p>
        </Card>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {submitting ? 'Creando propuesta…' : 'Crear propuesta de contratación'}
        </button>
      </form>
    </main>
  );
}

export default withRole(NewBookingPage, ['VENUE', 'PROMOTER']);

function Card({ title, icon, className, children }: { title: string; icon?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4 ${className ?? ''}`}>
      <header className="flex items-center gap-2">
        {icon && <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div>}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-slate-700 font-medium">{label}</span>
        {helper && <span className="text-xs text-slate-500">{helper}</span>}
      </div>
      {children}
    </div>
  );
}
