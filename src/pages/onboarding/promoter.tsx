import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import { CalendarSearch, CheckCircle2, Loader2, MapPin, ShieldPlus, Sparkles } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/context/MeContext';

const EVENT_TYPES = [
  { value: 'FESTIVAL', label: 'Festivales' },
  { value: 'CYCLES', label: 'Ciclos' },
  { value: 'TOURS', label: 'Giras' },
  { value: 'OTHER', label: 'Otros' },
];

export default function PromoterOnboardingPage() {
  const { user } = useAuth();
  const { refresh } = useMe();
  const router = useRouter();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasToken = Boolean(user?.token);

  const toggleEventType = (value: string) => {
    setEventTypes((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user?.token) {
      setError('Inicia sesion para continuar.');
      return;
    }
    if (!name || !city) {
      setError('Completa los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/onboarding/promoter`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          city,
          eventTypes,
        }),
      });
      if (!res.ok) throw new Error('No se pudo completar el onboarding.');

      refresh();
      await router.push('/promoter/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-8">
        <header className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <ShieldPlus className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">Onboarding Promotor</h1>
          <p className="text-sm text-slate-600">Cuéntanos qué produces para empezar.</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form onSubmit={onSubmit} className="space-y-6">
            <Card title="Identidad" icon={<Sparkles className="h-4 w-4 text-slate-600" />}>
              <Field label="Nombre profesional / marca">
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Evento Sur" />
              </Field>
              <Field label="Ciudad base">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <input className="w-full text-sm focus:outline-none" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad" />
                </div>
              </Field>
            </Card>

            <Card title="Tipo de actividad" icon={<CalendarSearch className="h-4 w-4 text-slate-600" />}>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                {EVENT_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:border-slate-300">
                    <input type="checkbox" checked={eventTypes.includes(type.value)} onChange={() => toggleEventType(type.value)} />
                    {type.label}
                  </label>
                ))}
              </div>
            </Card>

            {!hasToken && <p className="text-sm text-slate-500">Cargando sesión…</p>}

            <button
              type="submit"
              disabled={loading || !hasToken}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? 'Guardando…' : 'Finalizar onboarding'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
      <header className="flex items-center gap-2 text-slate-900 font-semibold">
        {icon}
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-sm text-slate-700 block">
      <span className="font-medium text-slate-800">{label}</span>
      {children}
    </label>
  );
}
