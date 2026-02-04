import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { getMyManagerProfile, updateMyManagerProfile } from '@/services/managers/managers.service';

 type ManagerProfile = {
  id: string;
  name: string;
  email?: string | null;
};

export default function ManagerProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ManagerProfile | null>(null);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    getMyManagerProfile(user.token)
      .then((data) => {
        setProfile({
          id: data.id,
          name: data.name ?? '',
          email: data.email ?? null,
        });
      })
      .catch((err: any) => setError(err?.message || 'No se pudo cargar el perfil'))
      .finally(() => setLoading(false));
  }, [user?.token]);

  const handleSave = async () => {
    if (!user?.token || !profile) return;

    setSaving(true);
    setError(null);
    try {
      await updateMyManagerProfile({ name: profile.name }, user.token);
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ padding: 24 }}>Cargando…</p>;
  }

  if (!profile) {
    return <p style={{ padding: 24 }}>No se pudo cargar el perfil.</p>;
  }

  return (
    <main
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Perfil de manager</h1>
        <p style={{ color: '#555' }}>Información mínima para operar en ARTIME.</p>
      </header>

      {error && <p style={{ color: '#b00020', marginBottom: 16 }}>{error}</p>}

      <section
        style={{
          border: '1px solid #ddd',
          padding: 20,
          borderRadius: 8,
          background: '#fff',
        }}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#666' }}>Nombre / agencia</span>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              style={{ padding: 10, border: '1px solid #ddd' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#666' }}>Email (solo lectura)</span>
            <input value={profile.email ?? ''} disabled style={{ padding: 10, border: '1px solid #ddd', background: '#f7f7f7' }} />
          </label>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 16px',
              borderRadius: 6,
              border: '1px solid #000',
              background: '#111',
              color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {saving && <span style={{ color: '#555' }}>Guardando…</span>}
        </div>
      </section>
    </main>
  );
}
