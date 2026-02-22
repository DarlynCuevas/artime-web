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
      router.replace('/promoter/dashboard');
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

      <main className="landing">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">ARTIME — Plataforma B2B</p>
            <h1>La infraestructura operativa detrás de cada contratación artística.</h1>
            <p className="subheadline">
              Centralice bookings, contratos y pagos en una única fuente de verdad diseñada para la industria musical profesional.
            </p>
            <p className="niche">Para artistas, managers, salas y promotores.</p>
            <div className="cta-group cta-desktop">
              <Link href="/register" className="cta primary">
                Comenzar ahora
              </Link>
              <Link href="/login" className="cta secondary">
                Acceso profesional
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              {/* TODO: Reemplazar hero-backstage.jpg por una imagen real */}
              <img
                src="/hero-backstage.jpg"
                alt="Backstage de un evento en preparación"
              />
              <div className="hero-image-overlay" aria-hidden="true" />
              <div className="hero-overlay booking-overlay">
                <pre>
{`Booking #1042
Estado: Oferta final aceptada
Contrato: Firmado
Pago: Pago pendiente`}
                </pre>
              </div>
            </div>
            <div className="hero-booking-card booking-card">
              <pre>
{`Booking #1042
Estado: Oferta final aceptada
Contrato: Firmado
Pago: Pago pendiente`}
              </pre>
            </div>
          </div>
          <div className="cta-mobile">
            <Link href="/register" className="cta primary">
              Comenzar ahora
            </Link>
            <p className="login-inline">
              ¿Ya tienes cuenta? <Link href="/login">Accede aquí</Link>
            </p>
          </div>
        </section>

        <section className="how">
          <h2>Cómo funciona</h2>
          <div className="how-grid">
            <div className="how-step"><span className="how-step-number">01</span>Se crea un booking</div>
            <div className="how-step"><span className="how-step-number">02</span>Se negocia dentro del sistema</div>
            <div className="how-step"><span className="how-step-number">03</span>Oferta final explícita</div>
            <div className="how-step"><span className="how-step-number">04</span>Contrato firmado</div>
            <div className="how-step"><span className="how-step-number">05</span>Pagos centralizados y trazables</div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="features">
          <div>
            <h3>Trazabilidad Total</h3>
            <p>Mantenga un historial inalterable de negociaciones y acuerdos. Elimine la ambigüedad y centralice la documentación de sus contrataciones en un solo lugar.</p>
          </div>
          <div>
            <h3>Gestión de Pagos</h3>
            <p>Flujos de liquidación claros y seguros. Automatice el seguimiento de pagos y garantice el cumplimiento de las condiciones pactadas para todas las partes.</p>
          </div>
          <div>
            <h3>Ecosistema B2B</h3>
            <p>Un entorno profesional verificado donde artistas, managers, salas y promotores interactúan bajo estándares de claridad, rigor y eficiencia operativa.</p>
          </div>
        </section>
      </main>

      <footer style={{ padding: '48px 24px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>© 2025 ARTIME. Plataforma de gestión operativa para profesionales de la música y el arte.</p>
      </footer>
    </div>
  );
}
