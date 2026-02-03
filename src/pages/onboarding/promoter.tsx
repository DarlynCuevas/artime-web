import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/auth/useAuth';

const EVENT_TYPES = [
  { value: 'FESTIVAL', label: 'Festivales' },
  { value: 'CYCLES', label: 'Ciclos' },
  { value: 'TOURS', label: 'Giras' },
  { value: 'OTHER', label: 'Otros' },
];

export default function PromoterOnboardingPage() {
  const { user } = useAuth();
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

      await router.push('/promoter/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Onboarding Promotor</h1>
        <p className="text-slate-600">Completa tu perfil minimo para operar en ARTIME.</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Identidad</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nombre profesional / marca</label>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ciudad base</label>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Tipo de actividad</h2>
          {EVENT_TYPES.map((type) => (
            <label key={type.value} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={eventTypes.includes(type.value)} onChange={() => toggleEventType(type.value)} />
              {type.label}
            </label>
          ))}
        </section>

        {!hasToken && <p className="text-sm text-slate-500">Cargando sesion...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !hasToken}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {loading ? 'Guardando...' : 'Finalizar onboarding'}
        </button>
      </form>
    </main>
  );
}
