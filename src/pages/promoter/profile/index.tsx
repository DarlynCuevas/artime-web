import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
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

export default function PromoterPrivateProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>
          Perfil privado del promotor
        </h1>
        <p style={{ color: '#555', maxWidth: 640 }}>
          Configura tu perfil publico. No incluye eventos ni operaciones.
        </p>
      </header>

      {loading && <p style={{ color: '#666' }}>Cargando...</p>}
      {error && (
        <p style={{ color: '#b00020', marginBottom: 16 }}>{error}</p>
      )}

      {!loading && profile && (
        <>
          <section
            style={{
              border: '1px solid #ddd',
              padding: 24,
              marginBottom: 32,
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>
              Identidad publica
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#666' }}>
                  Nombre del promotor / marca
                </span>
                <input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  style={{ padding: 10, border: '1px solid #ddd' }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#666' }}>
                  Ciudad base
                </span>
                <input
                  value={profile.city ?? ''}
                  onChange={(e) =>
                    setProfile({ ...profile, city: e.target.value })
                  }
                  style={{ padding: 10, border: '1px solid #ddd' }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#666' }}>
                  Pais
                </span>
                <input
                  value={profile.country ?? ''}
                  onChange={(e) =>
                    setProfile({ ...profile, country: e.target.value })
                  }
                  style={{ padding: 10, border: '1px solid #ddd' }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#666' }}>
                  Descripcion corta
                </span>
                <textarea
                  rows={4}
                  value={profile.description ?? ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      description: e.target.value,
                    })
                  }
                  style={{ padding: 10, border: '1px solid #ddd' }}
                />
              </label>
            </div>
          </section>

          <section
            style={{
              border: '1px solid #ddd',
              padding: 24,
              marginBottom: 32,
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>
              Tipo de actividad
            </h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {EVENT_TYPES.map((type) => (
                <label
                  key={type.value}
                  style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                >
                  <input
                    type="checkbox"
                    checked={eventTypes.includes(type.value)}
                    onChange={() => toggleEventType(type.value)}
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section
            style={{
              border: '1px solid #ddd',
              padding: 24,
              marginBottom: 32,
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>
              Configuracion de visibilidad
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={Boolean(profile.isPublic)}
                  onChange={(e) =>
                    setProfile({ ...profile, isPublic: e.target.checked })
                  }
                />
                <span>Perfil publico visible</span>
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={Boolean(profile.showPastEvents)}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      showPastEvents: e.target.checked,
                    })
                  }
                />
                <span>Mostrar eventos pasados</span>
              </label>
            </div>
          </section>

          <section
            style={{
              border: '1px solid #ddd',
              padding: 24,
              marginBottom: 32,
              background: '#fafafa',
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>
              Informacion de cuenta
            </h2>
            <div style={{ display: 'grid', gap: 8, color: '#555' }}>
              <div>Email: {email ?? 'No disponible'}</div>
              <div>
                Fecha de alta:{' '}
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : 'No disponible'}
              </div>
              <div>Onboarding: No disponible</div>
              <div>Estado Stripe: No requerido</div>
            </div>
          </section>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasToken}
            style={{
              border: '1px solid #000',
              background: '#000',
              color: '#fff',
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </>
      )}
    </main>
  );
}
