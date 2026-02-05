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
    if (role === 'MANAGER') {
      router.replace('/manager/dashboard');
      return;
    }

    // Si user existe pero role es null, NO redirigir (esperar a que role se actualice)
  }, [user, role, authLoading, meLoading, router]);

  if (authLoading || meLoading) {
    return (
      <main style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#64748b', fontSize: '14px', letterSpacing: '0.05em' }}>CARGANDO…</p>
      </main>
    );
  }

  if (user) {
    return (
      <main style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#64748b', fontSize: '14px', letterSpacing: '0.05em' }}>CARGANDO…</p>
      </main>
    );
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #f1f5f9', padding: '0 24px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.02em', color: '#0f172a' }}>ARTIME</span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: '14px', fontWeight: 500, color: '#475569', textDecoration: 'none' }}>
            Acceso profesional
          </Link>
          <Link href="/register" style={{ fontSize: '14px', fontWeight: 600, background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none' }}>
            Crear cuenta
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px' }}>
        {/* Hero Section */}
        <section style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '24px' }}>
            La infraestructura operativa para la industria artística.
          </h1>
          <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#475569', maxWidth: '640px', margin: '0 auto 40px auto' }}>
            Centralice la gestión de contratos, pagos y negociaciones en una plataforma B2B diseñada para la trazabilidad y el rigor profesional.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/register" style={{ padding: '14px 28px', borderRadius: '8px', background: '#0f172a', color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: '16px' }}>
              Comenzar ahora
            </Link>
            <Link href="/login" style={{ padding: '14px 28px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600, textDecoration: 'none', fontSize: '16px' }}>
              Iniciar sesión
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section style={{ maxWidth: '1100px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', padding: '64px 0', borderTop: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Trazabilidad Total</h3>
            <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.6 }}>Mantenga un historial inalterable de negociaciones y acuerdos. Elimine la ambigüedad y centralice la documentación de sus contrataciones en un solo lugar.</p>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Gestión de Pagos</h3>
            <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.6 }}>Flujos de liquidación claros y seguros. Automatice el seguimiento de pagos y garantice el cumplimiento de las condiciones pactadas para todas las partes.</p>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Ecosistema B2B</h3>
            <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.6 }}>Un entorno profesional verificado donde artistas, managers, salas y promotores interactúan bajo estándares de claridad, rigor y eficiencia operativa.</p>
          </div>
        </section>
      </main>

      <footer style={{ padding: '48px 24px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>© 2025 ARTIME. Plataforma de gestión operativa para profesionales de la música y el arte.</p>
      </footer>
    </div>
  );
}
