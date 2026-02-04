import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';

export default function IndexPage() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: meLoading } = useMe();
  const router = useRouter();


  useEffect(() => {
    if (authLoading || meLoading) {
      return;
    }

    // Si hay usuario y role definido
    if (role === 'VENUE') {
      router.replace('/venues');
      return;
    }
    if (role === 'ARTIST') {
      router.replace('/artists/dashboard');
      return;
    }
    if (role === 'PROMOTER') {
      router.replace('/events');
      return;
    }

    // Si user existe pero role es null, NO redirigir (esperar a que role se actualice)
  }, [user, role, authLoading, meLoading, router]);

  if (authLoading || meLoading) {
    return (
      <main style={{ padding: 32 }}>
        <p>Cargando…</p>
      </main>
    );
  }

  if (user) {
    return (
      <main style={{ padding: 32 }}>
        <p>Cargando…</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <section style={{ maxWidth: 520, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>ARTIME</h1>
          <p style={{ color: '#555' }}>
            Gestiona contrataciones artísticas con trazabilidad y claridad.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/login"
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: '#0f172a',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #0f172a',
              color: '#0f172a',
              fontWeight: 600,
            }}
          >
            Registrarme
          </Link>
        </div>
      </section>
    </main>
  );
}
