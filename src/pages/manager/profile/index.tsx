import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, Mail, Save, ShieldCheck, Users, Wallet } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { getMyManagerProfile, getMyRepresentedArtists, updateMyManagerProfile } from '@/services/managers/managers.service';
import { getStripeOnboardingStatus, startStripeOnboarding, type StripeOnboardingStatusResponse } from '@/services/payments/stripe-onboarding.service';

type ManagerProfile = {
  id: string;
  name: string;
  email?: string | null;
  createdAt?: string | null;
};

type RepresentedArtist = {
  id: string;
  name: string;
};

function ManagerProfilePage() {
  const { user } = useAuth();
  const { profileId } = useMe();

  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [representedArtists, setRepresentedArtists] = useState<RepresentedArtist[]>([]);
  const [profileName, setProfileName] = useState('');
  const [stripeStatus, setStripeStatus] = useState<StripeOnboardingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [manager, represented] = await Promise.all([
          getMyManagerProfile(user.token),
          getMyRepresentedArtists(user.token),
        ]);
        setProfile(manager);
        setProfileName(manager?.name ?? '');
        setRepresentedArtists(Array.isArray(represented) ? represented : []);

        if (profileId) {
          const stripe = await getStripeOnboardingStatus({
            role: 'MANAGER',
            profileId,
            token: user.token,
          });
          setStripeStatus(stripe);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.token, profileId]);

  const handleSave = async () => {
    if (!user?.token) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateMyManagerProfile({ name: profileName.trim() || undefined }, user.token);
      setProfile((prev) => (prev ? { ...prev, name: profileName.trim() || prev.name } : prev));
      setMessage('Perfil actualizado');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!user?.token || !profileId) return;
    setConnectingStripe(true);
    setError(null);
    try {
      const data = await startStripeOnboarding({
        role: 'MANAGER',
        profileId,
        token: user.token,
      });
      window.location.href = data.onboardingUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir Stripe');
      setConnectingStripe(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-rose-700">No se pudo cargar el perfil de manager.</div>;
  }

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Perfil privado</p>
        <h1 className="text-3xl font-semibold text-slate-900">Cuenta de manager</h1>
        <p className="text-slate-600">Gestiona tu identidad operativa y la conexión de pagos.</p>
      </header>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <ShieldCheck className="h-4 w-4 text-slate-600" />
          Datos básicos
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Nombre profesional</span>
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </label>
          <div className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Email</span>
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-500" />
              {profile.email || 'Sin email'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <Users className="h-4 w-4 text-slate-600" />
          Artistas representados
        </div>
        {representedArtists.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no representas artistas.</p>
        ) : (
          <div className="space-y-2">
            {representedArtists.map((artist) => (
              <div key={artist.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">{artist.name}</span>
                <Link href={`/artists/profile/${artist.id}`} className="text-xs font-semibold text-slate-700 hover:text-slate-900">
                  Ver perfil publico
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <Wallet className="h-4 w-4 text-slate-600" />
          Stripe Connect
        </div>
        <p className="text-sm text-slate-600">
          Estado: <span className="font-semibold">{formatStripeStatus(stripeStatus?.onboardingStatus)}</span>
        </p>
        {stripeStatus?.stripeAccountId ? (
          <p className="text-xs text-slate-500">Cuenta: {stripeStatus.stripeAccountId}</p>
        ) : null}

        <button
          type="button"
          onClick={handleConnectStripe}
          disabled={connectingStripe || !profileId}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
        >
          {connectingStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          {stripeStatus?.onboardingStatus === 'COMPLETED' ? 'Gestionar Stripe' : 'Conectar / continuar Stripe'}
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 inline-flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        Perfil publico disponible en la ruta `/manager/profile/{'{id}'}`.
      </section>
    </main>
  );
}

export default withRole(ManagerProfilePage, ['MANAGER']);

function formatStripeStatus(status?: string) {
  if (status === 'COMPLETED') return 'Completado';
  if (status === 'PENDING') return 'Pendiente';
  return 'No iniciado';
}

