import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, Mail, Save, ShieldCheck, Users, Wallet } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { getMyManagerProfile, getMyRepresentedArtists, updateMyManagerProfile } from '@/services/managers/managers.service';
import { getStripeOnboardingStatus, startStripeOnboarding, type StripeOnboardingStatusResponse } from '@/services/payments/stripe-onboarding.service';
import { VerificationBanner } from '@/components/profile/VerificationBanner';

type ManagerProfile = {
  id: string;
  name: string;
  email?: string | null;
  createdAt?: string | null;
  isVerified?: boolean;
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-rose-700">No se pudo cargar el perfil de manager.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="relative w-full overflow-hidden bg-fintech-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-0.5">Perfil privado</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Cuenta de manager</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/70">Gestiona identidad operativa, artistas representados y Stripe Connect.</p>
        </div>
      </div>

      {profile.isVerified ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">
          <VerificationBanner />
        </div>
      ) : null}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            Datos básicos
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1 text-sm text-slate-700">
              <span className="font-medium">Nombre profesional</span>
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-slate-400 focus:outline-none"
              />
            </label>
            <div className="space-y-1 text-sm text-slate-700">
              <span className="font-medium">Email</span>
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                {profile.email || 'Sin email'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700">
            <Users className="h-4 w-4 text-slate-500" />
            Artistas representados
          </div>
          {representedArtists.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no representas artistas.</p>
          ) : (
            <div className="space-y-2">
              {representedArtists.map((artist) => (
                <div key={artist.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-900">{artist.name}</span>
                  <Link href={`/artists/profile/${artist.id}`} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-amber-700">
                    Ver perfil público
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700">
            <Wallet className="h-4 w-4 text-slate-500" />
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
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            {connectingStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            {stripeStatus?.onboardingStatus === 'COMPLETED' ? 'Gestionar Stripe' : 'Conectar / continuar Stripe'}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Perfil público disponible en la ruta `/manager/profile/{'{id}'}`.
        </section>
      </main>
    </div>
  );
}

export default withRole(ManagerProfilePage, ['MANAGER']);

function formatStripeStatus(status?: string) {
  if (status === 'COMPLETED') return 'Completado';
  if (status === 'PENDING') return 'Pendiente';
  return 'No iniciado';
}
