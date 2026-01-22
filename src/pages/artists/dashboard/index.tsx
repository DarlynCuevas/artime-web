import { withRole } from '@/components/auth/withRole';
import { useArtistDashboard } from '@/hooks/artists/useArtistDashboard';

function ArtistDashboardPage() {
  const { data, loading, error } = useArtistDashboard();

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando dashboard…</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  }

  if (!data) {
    return <div style={{ padding: 24 }}>No hay datos disponibles</div>;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard · Artista</h1>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: 16,
          marginTop: 24,
          marginBottom: 32,
        }}
      >
        <Kpi title="Bookings activos" value={data.metrics.activeBookingsCount} />
        <Kpi title="Próximos shows" value={data.metrics.upcomingBookingsCount} />
        <Kpi title="Ingresos previstos" value={`${data.metrics.expectedIncome} €`} />
        <Kpi title="Ingresos confirmados" value={`${data.metrics.confirmedIncome} €`} />
        <Kpi title="Acciones pendientes" value={data.metrics.pendingActionsCount} />
        <Kpi
          title="Ocupa. mes"
          value={`${Math.round((data.metrics.occupancyRate ?? 0) * 100)}%`}
        />
        <Kpi title="Días reservados" value={data.metrics.reservedDaysCount} />
        <Kpi title="Días bloqueados" value={data.metrics.blockedDaysCount} />
        <Kpi title="Ingresos totales previstos" value={`${data.metrics.forecastIncome} €`} />
      </section>

      <section>
        <h2>Próximos shows</h2>

        {data.upcomingBookings.length === 0 && <p>No hay shows próximos</p>}

        <ul style={{ marginTop: 16 }}>
          {data.upcomingBookings.map((booking) => (
            <li
              key={booking.bookingId}
              style={{
                padding: 12,
                border: '1px solid #ddd',
                borderRadius: 6,
                marginBottom: 12,
              }}
            >
              <strong>{booking.venueName}</strong>
              <div>Fecha: {booking.startDate}</div>
              <div>Estado: {booking.status}</div>
              <div>
                Fee: {booking.totalAmount} {booking.currency}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default withRole(ArtistDashboardPage, ['ARTIST']);

function Kpi({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 16,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 14, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>{value}</div>
    </div>
  );
}
