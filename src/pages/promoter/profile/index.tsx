import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { MapPin, Globe2, Sparkle, Eye, EyeOff, CalendarClock, BadgeCheck, Loader2, CheckCircle2, Tags } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { withRole } from '@/components/auth/withRole';
import { supabase } from '@/services/supabase/supabaseClient';

type PromoterProfile = {
  id: string;
  name: string;
  city?: string | null;
  country?: string | null;
  description?: string | null;
  eventTypes?: string[];
  isPublic?: boolean | null;
  showPastEvents?: boolean | null;
  createdAt?: string | null;
};

const EVENT_TYPES = [
  { value: 'FESTIVAL', label: 'Festivales' },
  { value: 'CYCLES', label: 'Ciclos' },
  { value: 'TOURS', label: 'Giras' },
  { value: 'ONE_OFF', label: 'Eventos puntuales' },
];

function PromoterPrivateProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PromoterProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const hasToken = Boolean(user?.token);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data?.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/promoters/me`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'No se pudo cargar el perfil');
        }
        return res.json();
      })
      .then((data) => {
        setProfile({
          id: data.id,
          name: data.name ?? '',
          city: data.city ?? '',
          country: data.country ?? '',
          description: data.description ?? '',
          eventTypes: data.eventTypes ?? [],
          isPublic: data.isPublic ?? true,
          showPastEvents: data.showPastEvents ?? false,
          createdAt: data.createdAt ?? null,
        });
      })
      .catch((err: any) => {
        setError(err?.message || 'No se pudo cargar el perfil');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.token]);

  const eventTypes = useMemo(
    () => profile?.eventTypes ?? [],
    [profile?.eventTypes],
  );

  const toggleEventType = (value: string) => {
    if (!profile) return;
    const next = eventTypes.includes(value)
      ? eventTypes.filter((item) => item !== value)
      : [...eventTypes, value];
    setProfile({ ...profile, eventTypes: next });
  };

  const handleSave = async () => {
    if (!user?.token || !profile) return;

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/promoters/me`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: profile.name,
            city: profile.city,
            country: profile.country,
            description: profile.description,
            eventTypes: profile.eventTypes,
            isPublic: profile.isPublic,
            showPastEvents: profile.showPastEvents,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'No se pudo guardar el perfil');
      }
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Perfil</p>
        <h1 className="text-3xl font-semibold text-slate-900">Perfil privado del promotor</h1>
        <p className="text-slate-600">Datos que forman tu ficha pública. No incluye eventos ni métricas operativas.</p>
      </header>

      {loading && <div className="p-4 text-slate-700">Cargando…</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {!loading && profile && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Visibilidad" value={profile.isPublic ? 'Público' : 'Privado'} icon={profile.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} tone={profile.isPublic ? 'emerald' : 'slate'} />
            <KpiCard label="Eventos pasados" value={profile.showPastEvents ? 'Mostrando' : 'Ocultos'} icon={<CalendarClock className="h-4 w-4" />} tone={profile.showPastEvents ? 'emerald' : 'amber'} />
            <KpiCard label="Tipos" value={(profile.eventTypes?.length ?? 0) || '0'} icon={<Tags className="h-4 w-4" />} />
            <KpiCard label="Alta" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'} icon={<BadgeCheck className="h-4 w-4" />} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card title="Identidad pública" icon={<Sparkle className="h-4 w-4 text-slate-600" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nombre del promotor / marca">
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      placeholder="Ej. Live Nation"
                    />
                  </Field>
                  <Field label="Ciudad base" helper="Donde operas habitualmente">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <input
                        value={profile.city ?? ''}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        className="w-full text-sm focus:outline-none"
                        placeholder="Ciudad"
                      />
                    </div>
                  </Field>
                  <Field label="País">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <Globe2 className="h-4 w-4 text-slate-500" />
                      <input
                        value={profile.country ?? ''}
                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                        className="w-full text-sm focus:outline-none"
                        placeholder="País"
                      />
                    </div>
                  </Field>
                  <Field label="Descripción corta" helper="Máx. 240 caracteres">
                    <textarea
                      rows={4}
                      value={profile.description ?? ''}
                      onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      maxLength={240}
                      placeholder="Quién eres, qué promueves, qué te interesa."
                    />
                  </Field>
                </div>
              </Card>

              <Card title="Tipo de actividad" icon={<Sparkle className="h-4 w-4 text-slate-600" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EVENT_TYPES.map((type) => (
                    <label key={type.value} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-800 shadow-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={eventTypes.includes(type.value)}
                        onChange={() => toggleEventType(type.value)}
                      />
                      <span>{type.label}</span>
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card title="Visibilidad" icon={<Eye className="h-4 w-4 text-slate-600" />}>
                <div className="space-y-3 text-sm text-slate-700">
                  <ToggleRow
                    label="Perfil público visible"
                    checked={Boolean(profile.isPublic)}
                    onChange={(checked) => setProfile({ ...profile, isPublic: checked })}
                  />
                  <ToggleRow
                    label="Mostrar eventos pasados"
                    checked={Boolean(profile.showPastEvents)}
                    onChange={(checked) => setProfile({ ...profile, showPastEvents: checked })}
                  />
                </div>
              </Card>

              <Card title="Información de cuenta" icon={<BadgeCheck className="h-4 w-4 text-slate-600" />}>
                <div className="space-y-2 text-sm text-slate-700">
                  <StatusLine label="Email" value={email ?? 'No disponible'} />
                  <StatusLine label="Fecha de alta" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'No disponible'} />
                  <StatusLine label="Onboarding" value="No disponible" />
                  <StatusLine label="Stripe" value="No requerido" />
                </div>
              </Card>

              <Card title="Acción" icon={<CheckCircle2 className="h-4 w-4 text-slate-600" />}>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !hasToken}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                  {saved && <p className="text-xs text-emerald-700 text-center">Guardado.</p>}
                  <p className="text-xs text-slate-500 text-center">Los cambios impactan tu ficha pública de promotor.</p>
                </div>
              </Card>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default withRole(PromoterPrivateProfilePage, ['PROMOTER']);

function KpiCard({ label, value, icon, tone = 'slate' }: { label: string; value: string | number; icon?: ReactNode; tone?: 'slate' | 'emerald' | 'amber' }) {
  const toneClass = {
    slate: 'bg-slate-900 text-white',
    emerald: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-white',
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`px-4 py-4 ${toneClass}`}>
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

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm font-medium text-slate-800">
      <span>{label}</span>
      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
