import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { BadgeCheck, Calendar, EyeOff, MapPin, Sparkles, Ticket } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';

type PromoterProfile = {
  id: string;
  name: string;
  city?: string | null;
  country?: string | null;
  description?: string | null;
  eventTypes?: string[];
  isPublic?: boolean | null;
};

type PromoterEvent = {
  id: string;
  name: string;
  start_date?: string | null;
  status?: string | null;
  visibility?: string | null;
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  FESTIVAL: 'Festivales',
  CYCLES: 'Ciclos',
  TOURS: 'Giras',
  ONE_OFF: 'Eventos puntuales',
};

export default function PromoterPublicProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PromoterProfile | null>(null);
  const [events, setEvents] = useState<PromoterEvent[]>([]);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    if (!user?.token) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/promoters/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'No se pudo cargar el perfil');
        }
        return res.json();
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/promoters/${id}/events`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) return [];
          return res.json();
        })
        .catch(() => []),
    ])
      .then(([profileData, eventsData]) => {
        setProfile({
          id: profileData.id,
          name: profileData.name ?? 'Promotor',
          city: profileData.city ?? '',
          country: profileData.country ?? '',
          description: profileData.description ?? '',
          eventTypes: profileData.eventTypes ?? [],
          isPublic: profileData.isPublic ?? true,
        });
        setEvents(eventsData ?? []);
      })
      .catch((err: any) => {
        setError(err?.message || 'No se pudo cargar el perfil');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, user?.token]);

  const eventTypeLabels = useMemo(() => {
    return (profile?.eventTypes ?? []).map((type) => EVENT_TYPE_LABELS[type] ?? type);
  }, [profile?.eventTypes]);

  if (loading) return <div className="p-8 text-slate-700">Cargando perfil…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!profile) return <div className="p-8 text-slate-600">Perfil no disponible.</div>;

  if (profile.isPublic === false) {
    return (
      <main className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        <Card title="Perfil no disponible" icon={<EyeOff className="h-4 w-4 text-slate-600" />}>
          <p className="text-sm text-slate-700">Este promotor ha decidido ocultar su perfil público.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">Promotor</p>
        <h1 className="text-3xl font-semibold text-slate-900">{profile.name}</h1>
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin className="h-4 w-4" />
          <span>{[profile.city, profile.country].filter(Boolean).join(' · ') || 'Ubicación no indicada'}</span>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Visibilidad" value={profile.isPublic ? 'Público' : 'Privado'} icon={<BadgeCheck className="h-4 w-4" />} tone="emerald" />
        <KpiCard label="Eventos publicados" value={events.length} icon={<Ticket className="h-4 w-4" />} tone="slate" />
        <KpiCard label="Tipos" value={eventTypeLabels.length} icon={<Sparkles className="h-4 w-4" />} tone="amber" />
        <KpiCard label="ID" value={profile.id} icon={<BadgeCheck className="h-4 w-4" />} tone="slate" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Descripción" icon={<Sparkles className="h-4 w-4 text-slate-600" />}>
            <p className="text-sm text-slate-700 whitespace-pre-line">{profile.description || 'Sin descripción pública.'}</p>
          </Card>

          <Card title="Eventos organizados" icon={<Ticket className="h-4 w-4 text-slate-600" />}>
            {events.length === 0 ? (
              <EmptyState message="No hay eventos publicados." />
            ) : (
              <div className="divide-y divide-slate-100">
                {events.map((event) => (
                  <div key={event.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 py-3">
                    <div className="md:col-span-6">
                      <p className="font-semibold text-slate-900">{event.name}</p>
                      <p className="text-xs text-slate-500">ID: {event.id}</p>
                    </div>
                    <div className="md:col-span-3 text-sm text-slate-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span>{event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Fecha por definir'}</span>
                    </div>
                    <div className="md:col-span-3 text-sm text-slate-600 flex items-center gap-2">
                      <StatusPill value={event.status || 'Sin estado'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Actividad" icon={<Sparkles className="h-4 w-4 text-slate-600" />}>
            {eventTypeLabels.length === 0 ? (
              <p className="text-sm text-slate-600">No hay tipos declarados.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {eventTypeLabels.map((label) => (
                  <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {label}
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

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
        <p className="text-2xl font-semibold truncate">{value}</p>
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

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-slate-600">{message}</p>;
}

function StatusPill({ value }: { value: string }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">{value}</span>;
}
