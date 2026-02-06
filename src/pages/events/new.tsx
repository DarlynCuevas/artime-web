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
    <main className="p-6 md:p-10 max-w-4xl mx-auto space-y-12 bg-white min-h-screen">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-slate-900" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Artime OS • Project Initiation</p>
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Crear Evento</h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl">Define el marco operativo donde centralizarás bookings y producción.</p>
        </div>
      </header>

      <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-start gap-6 shadow-xl shadow-slate-900/10">
        <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <Info className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-tight">Marco de trabajo, no confirmación inmediata.</p>
          <p className="text-slate-400 text-[13px] font-medium leading-relaxed">
            Un evento en ARTIME es un contenedor de gestión. No estás cerrando actuaciones finales; solo creas el entorno para invitar artistas, negociar cachés y registrar decisiones operativas.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
          <Info className="h-5 w-5 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <section className="rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <header className="px-8 py-8 border-b border-slate-50 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                <FilePlus2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Definición Mínima</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Atributos base del proyecto</p>
              </div>
            </header>

            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre Operativo</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 px-5 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-0 transition-all outline-none placeholder:text-slate-300"
                  placeholder="Ej. Ciclo Acústico Otoño"
                />
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed px-1">
                  Usa un nombre que explique el contexto global de la producción, no una actuación individual.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Fecha de Inicio Estimada</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <input
                    type="date"
                    value={start_date}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 pl-14 pr-5 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-0 transition-all outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed px-1">
                  Es una referencia logística inicial; podrás ajustarla según evolucione el line-up.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-5 flex flex-col gap-8">
          <section className="rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <header className="px-8 py-8 border-b border-slate-50 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ejecución</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Siguiente paso operativo</p>
              </div>
            </header>

            <div className="p-8 space-y-6">
              <button
                type="submit"
                disabled={submitting || !user?.token}
                className="w-full h-16 inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-900 text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-30 transition-all group"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                )}
                {submitting ? 'Iniciando...' : 'Crear Evento'}
              </button>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center leading-relaxed">
                  Tras la creación podrás comenzar a invitar artistas y centralizar la gestión de pagos.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </main>
  );
}
