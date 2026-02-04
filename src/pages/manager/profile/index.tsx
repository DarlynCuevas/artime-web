import { useEffect, useState, type ReactNode } from 'react';
import { ShieldCheck, UserRound, Phone, Percent, Users, CheckCircle2, Loader2, AlertCircle, Globe2, MailCheck, Wallet } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';

type ManagerProfile = {
  id: string;
  nameProfessional: string;
  nameLegal: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  language: string;
  accountStatus: 'ACTIVE' | 'INCOMPLETE' | 'SUSPENDED';
  accountCreatedAt: string;
  lastActivity: string;
  represented: { id: string; name: string; startDate: string; commissionPercent: number; status: 'ACTIVE' | 'ENDED' }[];
  stripeStatus: 'NOT_CONNECTED' | 'PENDING_VERIFICATION' | 'VERIFIED';
  preferences: {
    emailNotifications: boolean;
    notificationLanguage: string;
  };
};

function ManagerProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      setProfile(null);
      return;
    }

    setLoading(true);

    // Mocked data until backend endpoint is ready.
    const mock: ManagerProfile = {
      id: 'manager-demo',
      nameProfessional: 'Manager Demo',
      nameLegal: 'Manager Demo SL',
      email: 'manager@artime.app',
      phone: '+34 600 123 456',
      country: 'España',
      city: 'Madrid',
      language: 'es',
      accountStatus: 'ACTIVE',
      accountCreatedAt: new Date(Date.now() - 120 * 86400000).toISOString(),
      lastActivity: new Date(Date.now() - 1 * 86400000).toISOString(),
      represented: [
        { id: 'artist-1', name: 'Luna Norte', startDate: new Date(Date.now() - 90 * 86400000).toISOString(), commissionPercent: 12, status: 'ACTIVE' },
        { id: 'artist-2', name: 'Electric Río', startDate: new Date(Date.now() - 45 * 86400000).toISOString(), commissionPercent: 10, status: 'ACTIVE' },
        { id: 'artist-3', name: 'Mar de Fuego', startDate: new Date(Date.now() - 200 * 86400000).toISOString(), commissionPercent: 15, status: 'ENDED' },
      ],
      stripeStatus: 'PENDING_VERIFICATION',
      preferences: {
        emailNotifications: true,
        notificationLanguage: 'es',
      },
    };

    setProfile(mock);
    setLoading(false);
  }, [user?.token]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    // Simulate async save
    await new Promise((resolve) => setTimeout(resolve, 450));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (loading) {
    return <div className="p-8 text-slate-700">Cargando perfil…</div>;
  }

  if (!profile) {
    return <div className="p-8 text-red-600">No se pudo cargar el perfil.</div>;
  }

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Perfil</p>
        <h1 className="text-3xl font-semibold text-slate-900">Identidad del manager</h1>
        <p className="text-slate-600">Refleja lo que ven los artistas. El backend sigue siendo la fuente de verdad.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard icon={<UserRound className="h-4 w-4" />} label="Nombre profesional" value={profile.nameProfessional} />
        <KpiCard icon={<ShieldCheck className="h-4 w-4" />} label="Estado de cuenta" value={statusLabel(profile.accountStatus)} />
        <KpiCard icon={<Users className="h-4 w-4" />} label="Artistas representados" value={profile.represented.length} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Información básica" icon={<ShieldCheck className="h-4 w-4 text-slate-600" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nombre / agencia">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  value={profile.nameProfessional}
                  onChange={(e) => setProfile({ ...profile, nameProfessional: e.target.value })}
                />
              </Field>
              <Field label="Nombre legal">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  value={profile.nameLegal}
                  onChange={(e) => setProfile({ ...profile, nameLegal: e.target.value })}
                />
              </Field>
              <Field label="Email" helper="Solo lectura, viene de auth">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  value={profile.email}
                  disabled
                />
              </Field>
              <Field label="Teléfono">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <input
                    className="w-full text-sm focus:outline-none"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </Field>
              <Field label="Ubicación">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    placeholder="País"
                    value={profile.country}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  />
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    placeholder="Ciudad"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>
              </Field>
              <Field label="Idioma preferido">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <Globe2 className="h-4 w-4 text-slate-500" />
                  <select
                    className="w-full bg-transparent focus:outline-none"
                    value={profile.language}
                    onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </Field>
            </div>
          </Card>

          <Card title="Representación activa" icon={<Users className="h-4 w-4 text-slate-600" />}>
            <div className="space-y-3">
              {profile.represented.map((artist) => (
                <div key={artist.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{artist.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <StatusPill status={artist.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED'} />
                      <span>Inicio: {formatDate(artist.startDate)}</span>
                      <span>Comisión: {artist.commissionPercent}%</span>
                    </div>
                  </div>
                  <a
                    href={`/artists/${artist.id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-slate-900"
                  >
                    Ver artista
                    <ArrowIcon />
                  </a>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Estado de la cuenta" icon={<AlertCircle className="h-4 w-4 text-slate-600" />}>
            <div className="space-y-2 text-sm text-slate-700">
              <StatusLine label="Estado" value={statusLabel(profile.accountStatus)} />
              <StatusLine label="Fecha de alta" value={formatDate(profile.accountCreatedAt)} />
              <StatusLine label="Última actividad" value={formatDate(profile.lastActivity)} />
              <p className="text-xs text-slate-500">Estos datos son de solo lectura.</p>
            </div>
          </Card>

          <Card title="Pagos (Stripe Connect)" icon={<Wallet className="h-4 w-4 text-slate-600" />}>
            <div className="space-y-3 text-sm text-slate-700">
              <StatusLine label="Estado" value={stripeLabel(profile.stripeStatus)} />
              <div className="flex gap-2">
                <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                  Configurar pagos
                </button>
                <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                  Actualizar info
                </button>
              </div>
              <p className="text-xs text-slate-500">Sin Stripe Connect verificado no se procesan payouts, pero sí puedes gestionar bookings.</p>
            </div>
          </Card>

          <Card title="Preferencias" icon={<MailCheck className="h-4 w-4 text-slate-600" />}>
            <div className="space-y-3 text-sm text-slate-700">
              <label className="flex items-center justify-between gap-3">
                <span>Notificaciones por email</span>
                <input
                  type="checkbox"
                  checked={profile.preferences.emailNotifications}
                  onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, emailNotifications: e.target.checked } })}
                  className="h-4 w-4"
                />
              </label>
              <div>
                <span className="text-xs text-slate-500">Idioma de notificaciones</span>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 mt-1">
                  <Globe2 className="h-4 w-4 text-slate-500" />
                  <select
                    className="w-full bg-transparent focus:outline-none"
                    value={profile.preferences.notificationLanguage}
                    onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, notificationLanguage: e.target.value } })}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Acción" icon={<ShieldCheck className="h-4 w-4 text-slate-600" />}>
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? 'Guardando…' : 'Guardar cambios locales'}
              </button>
              {saved && <p className="text-xs text-emerald-700 text-center">Cambios guardados (mock).</p>}
              <p className="text-xs text-slate-500 text-center">Datos moqueados en v1. No impacta backend.</p>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

export default withRole(ManagerProfilePage, ['MANAGER']);

function KpiCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="px-4 py-4 bg-slate-900 text-white">
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
      <header className="flex items-center gap-2 text-slate-900 font-semibold">
        {icon}
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-sm text-slate-700">
      <span className="font-medium text-slate-800">{label}</span>
      {children}
      {helper && <span className="text-xs text-slate-500">{helper}</span>}
    </label>
  );
}

function StatusPill({ status }: { status: 'ACTIVE' | 'PAUSED' }) {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
    }`}>
      <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-slate-500'}`} />
      {isActive ? 'Active' : 'Pausado'}
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 18l6-6-6-6" />
    </svg>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusLabel(status: ManagerProfile['accountStatus']) {
  const map: Record<ManagerProfile['accountStatus'], string> = {
    ACTIVE: 'Activa',
    INCOMPLETE: 'Incompleta',
    SUSPENDED: 'Suspendida',
  };
  return map[status];
}

function stripeLabel(status: ManagerProfile['stripeStatus']) {
  const map: Record<ManagerProfile['stripeStatus'], string> = {
    NOT_CONNECTED: 'No conectado',
    PENDING_VERIFICATION: 'Pendiente de verificación',
    VERIFIED: 'Verificado',
  };
  return map[status];
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
