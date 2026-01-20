import Link from 'next/link';

export default function VenueHome() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      {/* HEADER */}
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>
          ¿Qué quieres hacer hoy?
        </h1>
        <p style={{ color: '#555', maxWidth: 600 }}>
          ARTIME te permite descubrir artistas, comprobar
          disponibilidad y gestionar contrataciones
          profesionales desde un solo lugar.
        </p>
      </header>

      {/* ACCIONES PRINCIPALES */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
          marginBottom: 48,
        }}
      >
        {/* DISCOVER */}
        <Link href="/venue/discover" style={{ textDecoration: 'none' }}>
          <div
            style={{
              border: '1px solid #ddd',
              padding: 24,
              cursor: 'pointer',
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>
              Discover artistas
            </h2>
            <p style={{ color: '#666', fontSize: 14 }}>
              Explora artistas, conoce su perfil profesional
              y guarda referencias para futuras contrataciones.
            </p>
          </div>
        </Link>

        {/* SEARCH */}
        <Link href="/venue/search" style={{ textDecoration: 'none' }}>
          <div
            style={{
              border: '1px solid #ddd',
              padding: 24,
              cursor: 'pointer',
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>
              Buscar por fecha
            </h2>
            <p style={{ color: '#666', fontSize: 14 }}>
              Selecciona una fecha y encuentra artistas
              disponibles para iniciar una contratación.
            </p>
          </div>
        </Link>
      </section>

      {/* CONTEXTO */}
      <section>
        <p style={{ color: '#777', fontSize: 13, maxWidth: 600 }}>
          Todas las negociaciones, contratos y pagos se
          gestionan dentro de ARTIME. Nada importante ocurre
          fuera del sistema.
        </p>
      </section>
    </main>
  );
}
