import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/auth/useAuth';

export default function VenueOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [capacity, setCapacity] = useState('');
  const [address, setAddress] = useState('');
  const [venueType, setVenueType] = useState('');
  const [hasProgramming, setHasProgramming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasToken = Boolean(user?.token);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user?.token) {
      setError('Inicia sesión para continuar.');
      return;
    }
    if (!name || !city) {
      setError('Completa los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/onboarding/venue`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          city,
          capacity: capacity ? Number(capacity) : null,
          address: address || null,
          venueType,
          hasRegularProgramming: hasProgramming,
        }),
      });
      if (!res.ok) throw new Error('No se pudo completar el onboarding.');

      await router.push('/venues/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Onboarding Sala</h1>
        <p className="text-slate-600">Completa tu perfil mínimo para operar en ARTIME.</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Identidad</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nombre de la sala</label>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ciudad</label>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Capacidad (opcional)</label>
            <input type="number" className="w-full rounded-md border border-slate-300 px-3 py-2" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Dirección (opcional)</label>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Perfil operativo</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipo de sala</label>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" value={venueType} onChange={(e) => setVenueType(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={hasProgramming} onChange={(e) => setHasProgramming(e.target.checked)} />
            Programación regular
          </label>
        </section>

        {!hasToken && <p className="text-sm text-slate-500">Cargando sesion...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !hasToken}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {loading ? 'Guardando…' : 'Finalizar onboarding'}
        </button>
      </form>
    </main>
  );
}
