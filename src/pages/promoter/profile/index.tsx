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
    <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-12 bg-white min-h-screen">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-slate-900" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Artime OS • Promoter Identity</p>
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Perfil Operativo</h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl">Gestiona los datos que definen tu presencia profesional en el ecosistema.</p>
        </div>
      </header>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
           <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando perfil...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 shrink-0 rotate-180" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {!loading && profile && (
        <div className="space-y-12">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Visibilidad" value={profile.isPublic ? 'Público' : 'Privado'} icon={profile.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} tone={profile.isPublic ? 'emerald' : 'slate'} />
            <KpiCard label="Eventos pasados" value={profile.showPastEvents ? 'Visible' : 'Oculto'} icon={<CalendarClock className="h-4 w-4" />} tone={profile.showPastEvents ? 'emerald' : 'amber'} />
            <KpiCard label="Tipos de Actividad" value={(profile.eventTypes?.length ?? 0)} icon={<Tags className="h-4 w-4" />} />
            <KpiCard label="Antigüedad" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' }) : '—'} icon={<BadgeCheck className="h-4 w-4" />} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card title="Identidad Corporativa" icon={<Sparkle className="h-5 w-5" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Field label="Nombre del promotor / marca">
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-0 transition-all outline-none"
                      placeholder="Ej. Live Nation"
                    />
                  </Field>
                  <Field label="Ciudad base" helper="Área de operación principal">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 h-12 focus-within:bg-white focus-within:border-slate-900 transition-all group">
                      <MapPin className="h-4 w-4 text-slate-400 group-focus-within:text-slate-900" />
                      <input
                        value={profile.city ?? ''}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        className="w-full text-sm font-bold text-slate-900 focus:outline-none bg-transparent"
                        placeholder="Ciudad"
                      />
                    </div>
                  </Field>
                  <Field label="País">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 h-12 focus-within:bg-white focus-within:border-slate-900 transition-all group">
                      <Globe2 className="h-4 w-4 text-slate-400 group-focus-within:text-slate-900" />
                      <input
                        value={profile.country ?? ''}
                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                        className="w-full text-sm font-bold text-slate-900 focus:outline-none bg-transparent"
                        placeholder="País"
                      />
                    </div>
                  </Field>
                  <Field label="Descripción de marca" helper="Máx. 240 caracteres">
                    <textarea
                      rows={4}
                      value={profile.description ?? ''}
                      onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                      className="w-full rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-0 transition-all outline-none resize-none"
                      maxLength={240}
                      placeholder="Identidad, intereses y enfoque operativo."
                    />
                  </Field>
                </div>
              </Card>

              <Card title="Especialización" subtitle="Segmentos de mercado" icon={<Tags className="h-5 w-5" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {EVENT_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 cursor-pointer transition-all ${
                        eventTypes.includes(type.value)
                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">{type.label}</span>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={eventTypes.includes(type.value)}
                        onChange={() => toggleEventType(type.value)}
                      />
                      <div className={`size-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                        eventTypes.includes(type.value) ? 'border-white bg-white' : 'border-slate-200 bg-transparent'
                      }`}>
                         {eventTypes.includes(type.value) && <CheckCircle2 className="size-3 text-slate-900" />}
                      </div>
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card title="Control de Visibilidad" icon={<Eye className="h-5 w-5" />}>
                <div className="space-y-4">
                  <ToggleRow
                    label="Ficha pública activa"
                    checked={Boolean(profile.isPublic)}
                    onChange={(checked) => setProfile({ ...profile, isPublic: checked })}
                  />
                  <ToggleRow
                    label="Mostrar histórico de eventos"
                    checked={Boolean(profile.showPastEvents)}
                    onChange={(checked) => setProfile({ ...profile, showPastEvents: checked })}
                  />
                </div>
              </Card>

              <Card title="Información de Sistema" icon={<BadgeCheck className="h-5 w-5" />}>
                <div className="space-y-4 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <StatusLine label="ID Operativo" value={`#${profile.id.slice(0, 8)}`} />
                  <StatusLine label="Email Registro" value={email ?? '—'} />
                  <StatusLine label="Sincronización Stripe" value="No requerida" />
                  <div className="h-px bg-slate-200 my-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                     Los datos de facturación se gestionan a nivel de contrato individual.
                  </p>
                </div>
              </Card>

              <Card title="Acción" icon={<CheckCircle2 className="h-5 w-5" />}>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !hasToken}
                    className="w-full h-16 inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-900 text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-30 transition-all group"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                    {saving ? 'Procesando...' : 'Actualizar Perfil'}
                  </button>
                  {saved && (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-bottom-2">
                       <CheckCircle2 className="size-4" />
                       <span className="text-[11px] font-black uppercase tracking-widest">Cambios aplicados</span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] text-center">
                    Afecta a tu visibilidad en el ecosistema.
                  </p>
                </div>
              </Card>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default withRole(PromoterPrivateProfilePage, ['PROMOTER']);

function KpiCard({ label, value, icon, tone = 'slate' }: { label: string; value: string | number; icon?: ReactNode; tone?: 'slate' | 'emerald' | 'amber' }) {
  const accentBg = {
    slate: 'bg-slate-900',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col group hover:border-slate-400 transition-colors">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-50 bg-slate-50/50">
        <div className="text-slate-400 group-hover:text-slate-900 transition-colors">
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <div className={`px-4 py-5 ${accentBg} text-white`}>
        <p className="text-2xl font-black tracking-tighter tabular-nums leading-none uppercase">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <header className="px-8 py-8 border-b border-slate-50 flex items-center gap-5">
        {icon && (
          <div className="size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10 shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h2>
          {subtitle && <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em] leading-none">{subtitle}</p>}
        </div>
      </header>
      <div className="p-8 flex-1">
        {children}
      </div>
    </section>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      {children}
      {helper && <p className="text-[10px] text-slate-400 font-medium px-1">{helper}</p>}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:border-slate-900 transition-all group">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full p-1 transition-all ${checked ? 'bg-slate-900' : 'bg-slate-200'}`}
      >
        <div className={`size-4 rounded-full bg-white transition-all transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
      <input type="checkbox" className="hidden" checked={checked} readOnly />
    </label>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}
