import { useState } from 'react';
import { useRouter } from 'next/router';
import { CalendarClock, CheckCircle2, FilePlus2, Info, Loader2, Sparkles } from 'lucide-react';

import { eventsService } from '@/services/events/events.service';
import { useAuth } from '@/hooks/auth/useAuth';

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [start_date, setStartDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.token) {
      setError('Necesitas iniciar sesión para crear un evento.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await eventsService.createEvent({ name, start_date }, user.token);
      router.push('/events');
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear el evento');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Eventos</p>
        <h1 className="text-3xl font-semibold text-slate-900">Crear nuevo evento</h1>
        <p className="text-slate-600">Define el contenedor operativo donde luego moverás bookings, pagos y equipo.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-start gap-3 text-sm text-slate-700">
          <Info className="h-4 w-4 text-slate-500 mt-0.5" />
          <div>
            <p className="font-medium text-slate-900">Marco, no confirmación.</p>
            <p className="text-slate-600">No estás cerrando actuaciones; solo creas el marco para operar, invitar artistas y registrar decisiones.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
          <header className="flex items-center gap-2 text-slate-900 font-semibold">
            <FilePlus2 className="h-4 w-4 text-slate-600" />
            <h2>Definición mínima</h2>
          </header>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Nombre del evento</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="Ej. Ciclo acústico otoño"
            />
            <p className="text-xs text-slate-500">Usa un nombre que explique el contexto, no una actuación concreta.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Fecha de inicio</label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              <input
                type="date"
                value={start_date}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full text-sm focus:outline-none"
              />
            </div>
            <p className="text-xs text-slate-500">Es una referencia editable; podrás moverla más adelante.</p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
          <header className="flex items-center gap-2 text-slate-900 font-semibold">
            <Sparkles className="h-4 w-4 text-slate-600" />
            <h2>Acción</h2>
          </header>
          <button
            type="submit"
            disabled={submitting || !user?.token}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {submitting ? 'Creando evento…' : 'Crear evento'}
          </button>
          <p className="text-xs text-slate-500 text-center">Luego podrás invitar artistas, gestionar bookings y pagos.</p>
        </section>
      </form>
    </main>
  );
}
