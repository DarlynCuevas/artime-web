import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import { CalendarDays, CheckCircle2, Guitar, Loader2, MapPin, Music2, ShieldPlus, Sparkles } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/context/MeContext';

export default function ArtistOnboardingPage() {
  const { user } = useAuth();
  const { refresh } = useMe();
  const router = useRouter();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [genresText, setGenresText] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [availability, setAvailability] = useState<'available' | 'block'>('available');
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

    const genres = genresText.split(',').map((g) => g.trim()).filter(Boolean);
    const price = Number(basePrice);
    if (!name || !city || genres.length === 0 || !price) {
      setError('Completa los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/onboarding/artist`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          city,
          genres,
          basePrice: price,
          isNegotiable,
        }),
      });
      if (!res.ok) throw new Error('No se pudo completar el onboarding.');

      refresh();
      await router.push('/artists/dashboard');
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
          <h1 className="text-3xl font-semibold text-slate-900">Onboarding Artista</h1>
          <p className="text-sm text-slate-600">Completa el mínimo para operar en Artime.</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form onSubmit={onSubmit} className="space-y-6">
            <Card title="Identidad básica" icon={<Guitar className="h-4 w-4 text-slate-600" />}>
              <Field label="Nombre artístico">
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Luna Norte" />
              </Field>
              <Field label="Ciudad base">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <input className="w-full text-sm focus:outline-none" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad" />
                </div>
              </Field>
              <Field label="Géneros (separados por coma)">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <Music2 className="h-4 w-4 text-slate-500" />
                  <input className="w-full text-sm focus:outline-none" value={genresText} onChange={(e) => setGenresText(e.target.value)} placeholder="Indie, pop, electrónica" />
                </div>
              </Field>
            </Card>

            <Card title="Caché" icon={<Sparkles className="h-4 w-4 text-slate-600" />}>
              <Field label="Caché base">
                <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="Ej. 500" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={isNegotiable} onChange={(e) => setIsNegotiable(e.target.checked)} />
                Caché negociable
              </label>
            </Card>

            <Card title="Disponibilidad inicial" icon={<CalendarDays className="h-4 w-4 text-slate-600" />}>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" checked={availability === 'available'} onChange={() => setAvailability('available')} />
                Estoy disponible por defecto
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" checked={availability === 'block'} onChange={() => setAvailability('block')} />
                Bloquear fechas ahora (lo haré después)
              </label>
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
