import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Building2, CheckCircle2, Loader2, MapPin, ShieldPlus, Users, Waves } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/context/MeContext';
import { AuthShell } from '@/components/auth/AuthShell';

export default function VenueOnboardingPage() {
  const { user } = useAuth();
  const { refresh } = useMe();
  const router = useRouter();
  const [profileName, setProfileName] = useState('');
  const [city, setCity] = useState('');
  const [capacity, setCapacity] = useState('');
  const [address, setAddress] = useState('');
  const [venueType, setVenueType] = useState('');
  const [hasRegularProgramming, setHasRegularProgramming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasToken = Boolean(user?.token);
  const queryDisplayName = typeof router.query.displayName === 'string' ? router.query.displayName.trim() : '';

  useEffect(() => {
    if (!profileName && queryDisplayName) {
      setProfileName(queryDisplayName);
    }
  }, [profileName, queryDisplayName]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user?.token) {
      setError('Inicia sesión para continuar.');
      return;
    }

    const capacityNumber = Number(capacity);
    if (!profileName || !city || !capacityNumber || !venueType) {
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
          name: profileName,
          city,
          capacity: capacityNumber,
          address,
          venueType,
          hasRegularProgramming,
        }),
      });
      if (!res.ok) throw new Error('No se pudo completar el onboarding.');

      refresh();
      await router.push('/venues/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Onboarding · Sala"
      subtitle="Completa los datos básicos para iniciar contrataciones."
      eyebrow="Onboarding"
      icon={<ShieldPlus className="h-6 w-6" />}
      backHref="/"
      footer={<p className="text-xs text-slate-500">Podrás completar el perfil con más detalle después.</p>}
    >
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">{error}</div>}

      <form onSubmit={onSubmit} className="space-y-6 mt-4">
            <Card title="Datos básicos" icon={<Building2 className="h-4 w-4 text-slate-600" />}>
              {profileName ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Nombre visible: <span className="font-semibold text-slate-900">{profileName}</span>
                </div>
              ) : (
                <Field label="Nombre del venue">
                  <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Ej. Sala Prisma" />
                </Field>
              )}
              <Field label="Ciudad">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <input className="w-full text-sm focus:outline-none" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad" />
                </div>
              </Field>
              <Field label="Dirección">
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle y número" />
              </Field>
            </Card>

            <Card title="Operación" icon={<Users className="h-4 w-4 text-slate-600" />}>
              <Field label="Capacidad">
                <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Ej. 800" />
              </Field>
              <Field label="Tipo de venue">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <Waves className="h-4 w-4 text-slate-500" />
                  <input className="w-full text-sm focus:outline-none" value={venueType} onChange={(e) => setVenueType(e.target.value)} placeholder="Club, teatro, festival…" />
                </div>
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={hasRegularProgramming} onChange={(e) => setHasRegularProgramming(e.target.checked)} />
                Tengo programación regular
              </label>
            </Card>

            {!hasToken && <p className="text-sm text-slate-500">Cargando sesión…</p>}

            <button
              type="submit"
              disabled={loading || !hasToken}
              className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? 'Guardando…' : 'Finalizar onboarding'}
            </button>
          </form>
    </AuthShell>
  );
}

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
      <header className="flex items-center gap-2 text-slate-900 font-black">
        {icon}
        <h2 className="text-sm uppercase tracking-widest">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-sm text-slate-700 block">
      <span className="font-semibold text-slate-800">{label}</span>
      {children}
    </label>
  );
}
