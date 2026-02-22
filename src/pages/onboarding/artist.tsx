import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CalendarDays, CheckCircle2, ExternalLink, Guitar, Loader2, MapPin, Music2, ShieldPlus, Sparkles } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/context/MeContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { startArtistStripeOnboarding } from '@/services/payments/stripe-onboarding.service';

export default function ArtistOnboardingPage() {
  const { user } = useAuth();
  const { refresh } = useMe();
  const router = useRouter();
  const [profileName, setProfileName] = useState('');
  const [city, setCity] = useState('');
  const [genresText, setGenresText] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [availability, setAvailability] = useState<'available' | 'block'>('available');
  const [loading, setLoading] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasToken = Boolean(user?.token);
  const queryDisplayName = typeof router.query.displayName === 'string' ? router.query.displayName.trim() : '';

  useEffect(() => {
    if (!profileName && queryDisplayName) {
      setProfileName(queryDisplayName);
    }
  }, [profileName, queryDisplayName]);

  const submitOnboarding = async (connectStripeAfterSave = false) => {
    setError(null);
    if (!user?.token) {
      setError('Inicia sesión para continuar.');
      return;
    }

    const genres = genresText.split(',').map((g) => g.trim()).filter(Boolean);
    const price = Number(basePrice);
    if (!profileName || !city || genres.length === 0 || !price) {
      setError('Completa los campos obligatorios.');
      return;
    }

    if (connectStripeAfterSave) {
      setLoadingStripe(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/onboarding/artist`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileName,
          city,
          genres,
          basePrice: price,
          isNegotiable,
        }),
      });
      if (!res.ok) throw new Error('No se pudo completar el onboarding.');
      const payload = (await res.json()) as { id?: string };

      if (connectStripeAfterSave) {
        const artistId = payload?.id ?? user.id;
        const stripe = await startArtistStripeOnboarding({
          artistId,
          token: user.token,
        });
        window.location.href = stripe.onboardingUrl;
        return;
      }

      refresh();
      await router.push('/artists/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el perfil.');
    } finally {
      setLoading(false);
      setLoadingStripe(false);
    }
  };

  const onSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitOnboarding(false);
  };

  const onSubmitAndConnectStripe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await submitOnboarding(true);
  };

  return (
    <AuthShell
      title="Onboarding · Artista"
      subtitle="Completa lo mínimo para operar y recibir propuestas."
      eyebrow="Onboarding"
      icon={<ShieldPlus className="h-6 w-6" />}
      backHref="/"
      footer={
        <p className="text-xs text-slate-500">
          Este onboarding define tu perfil operativo inicial. Puedes editarlo más tarde.
        </p>
      }
    >
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">{error}</div>}

      <form onSubmit={onSubmitForm} className="space-y-6 mt-4">
            <Card title="Identidad básica" icon={<Guitar className="h-4 w-4 text-slate-600" />}>
              {profileName ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Nombre visible: <span className="font-semibold text-slate-900">{profileName}</span>
                </div>
              ) : (
                <Field label="Nombre artístico">
                  <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Ej. Luna Norte" />
                </Field>
              )}
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

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || loadingStripe || !hasToken}
                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {loading ? 'Guardando…' : 'Finalizar onboarding'}
              </button>

              <button
                type="button"
                onClick={onSubmitAndConnectStripe}
                disabled={loading || loadingStripe || !hasToken}
                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition-all duration-300"
              >
                {loadingStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                {loadingStripe ? 'Abriendo Stripe…' : 'Finalizar y conectar Stripe'}
              </button>
              <p className="text-xs text-slate-500">
                Opcional. Si no conectas Stripe ahora, podrás hacerlo después desde Configuración.
              </p>
            </div>
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
