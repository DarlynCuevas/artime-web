import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
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

  if (loading) {
    return <p className="p-8 text-slate-600">Cargando perfil...</p>;
  }

  if (error) {
    return <p className="p-8 text-red-600">{error}</p>;
  }

  if (!profile) {
    return <p className="p-8 text-slate-600">Perfil no disponible.</p>;
  }

  if (profile.isPublic === false) {
    return (
      <main className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-3">Perfil no disponible</h1>
        <p className="text-slate-600">
          Este promotor ha decidido ocultar su perfil publico.
        </p>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">{profile.name}</h1>
        <p className="text-slate-600">
          {[profile.city, profile.country].filter(Boolean).join(' · ')}
        </p>
      </header>

      {profile.description ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Descripcion</h2>
          <p className="text-slate-600 whitespace-pre-line">{profile.description}</p>
        </section>
      ) : null}

      {eventTypeLabels.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Tipo de actividad</h2>
          <div className="flex flex-wrap gap-2">
            {eventTypeLabels.map((label) => (
              <span key={label} className="rounded-full border px-3 py-1 text-sm text-slate-700">
                {label}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Eventos organizados</h2>
        {events.length === 0 ? (
          <p className="text-slate-600">No hay eventos publicados.</p>
        ) : (
          <div className="grid gap-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border p-4">
                <div className="font-medium text-slate-900">{event.name}</div>
                <div className="text-sm text-slate-600">
                  {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Fecha por definir'}
                </div>
                {event.status ? (
                  <div className="text-xs text-slate-500">Estado: {event.status}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
