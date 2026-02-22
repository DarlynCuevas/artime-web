import { useState } from 'react';
import { useRouter } from 'next/router';
import { CalendarClock, CheckCircle2, FilePlus2, Info, Loader2, Sparkles, Euro, LayoutTemplate } from 'lucide-react';

import { eventsService } from '@/services/events/events.service';
import { useAuth } from '@/hooks/auth/useAuth';

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [start_date, setStartDate] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState<string>('');

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

    // Convert estimatedBudget a número si se proporcionó, si no, enviar null
    let budgetValue: number | null = null;
    if (estimatedBudget.trim() !== '') {
      budgetValue = Number(estimatedBudget);
      if (isNaN(budgetValue)) {
        setError('El presupuesto debe ser un número válido.');
        setSubmitting(false);
        return;
      }
    }

    try {
      await eventsService.createEvent({
        name,
        start_date,
        estimatedBudget: budgetValue
      }, user.token);
      router.push('/events');
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear el evento');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20 selection:bg-emerald-100 selection:text-emerald-900 -mt-[73px]">

      {/* Background Decorativo */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[1000px] h-[1000px] bg-emerald-400/5 rounded-full blur-3xl opacity-50 mix-blend-multiply" />
        <div className="absolute top-1/2 -left-1/4 w-[800px] h-[800px] bg-blue-400/5 rounded-full blur-3xl opacity-50 mix-blend-multiply" />
      </div>

      <main className="relative z-10 p-6 sm:p-8 pt-32 max-w-3xl mx-auto space-y-8">

        {/* HERO SECTION */}
        <header className="space-y-4">
         

          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight sm:mt-8">
              Crear nuevo evento
            </h1>
            <p className="mt-2 text-slate-600 font-medium text-sm sm:text-base leading-relaxed">
              Define el contenedor base. Aquí registrarás operaciones, invitarás artistas y controlarás el presupuesto.
            </p>
          </div>
        </header>

        {/* INFO CARD */}
        <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-emerald-600 font-bold text-sm">ℹ️</span>
          </div>
          <div>
            <p className="font-bold text-emerald-900 text-sm">Marco operativo, no actuación confirmada.</p>
            <p className="text-sm text-emerald-700/90 font-medium mt-1 leading-relaxed">
              Al crear este evento no estás cerrando contrataciones; simplemente construyes el marco desde el que podrás operar, enviar propuestas e invitar artistas.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 backdrop-blur-sm p-4 text-sm font-medium text-rose-700 flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <span className="text-rose-600 font-bold">!</span>
            </div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* DEFINICIÓN MÍNIMA */}
          <section className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <FilePlus2 className="h-4 w-4 text-slate-600" />
              </div>
              <h2 className="font-black text-slate-900 tracking-tight">Definición mínima</h2>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2.5">
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Nombre del evento</label>
                <div className="relative group">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all duration-300"
                    placeholder="Ej. Ciclo acústico otoño"
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-400 pl-1">Usa un nombre global que describa la iniciativa, no una actuación en sí.</p>
              </div>

              <div className="space-y-2.5">
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Fecha de inicio</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CalendarClock className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="date"
                    value={start_date}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all duration-300"
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-400 pl-1">Es una referencia temporal para arrancar; podrás modificarla o añadir más días luego.</p>
              </div>
            </div>
          </section>

          {/* LOGÍSTICA ECONÓMICA (NUEVO) */}
          <section className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Euro className="h-4 w-4 text-slate-600" />
              </div>
              <h2 className="font-black text-slate-900 tracking-tight">Logística Económica</h2>
            </div>

            <div className="p-6 sm:p-8">
              <div className="space-y-2.5">
                <label className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
                  Presupuesto Estimado
                  <span className="text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full text-[9px]">Opcional</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold group-focus-within:text-emerald-500 transition-colors">€</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all duration-300 tabular-nums"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-400 pl-1">
                  Establece un techo de gasto referencial para llevar el control de los bookings y costes derivados.
                </p>
              </div>
            </div>
          </section>

          {/* ACCIÓN PRIMARIA */}
          <section className="pt-2">
            <button
              type="submit"
              disabled={submitting || !user?.token}
              className="w-full h-14 relative group overflow-hidden rounded-2xl bg-slate-900 text-white font-bold text-sm tracking-wide shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] skew-x-12 group-hover:animate-[shine_1.5s_ease-out_infinite]" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                    Creando evento…
                  </>
                ) : (
                  <>
                    Crear evento contenedor
                    <Sparkles className="h-4 w-4 text-emerald-400 opacity-80" />
                  </>
                )}
              </span>
            </button>
            <p className="text-[11px] font-medium text-slate-400 text-center mt-4 uppercase tracking-widest">
              Después configurarás los detalles específicos.
            </p>
          </section>

        </form>
      </main>
    </div>
  );
}
