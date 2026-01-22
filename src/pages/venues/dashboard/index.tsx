import { useVenueDashboard } from '@/hooks/venues/useVenueDashboard';
import { withRole } from '@/components/auth/withRole';

function VenueDashboardPage() {
  const { data, loading } = useVenueDashboard();

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando dashboard…</div>;
  }

  if (!data) {
    return <div style={{ padding: 24 }}>No hay datos disponibles</div>;
  }

  const { metrics, upcomingBookings } = data;

  return (
    <>

      <main style={{ padding: 24 }}>
        <h1>Dashboard · Venue</h1>

        {/* KPIs */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginTop: 24,
            marginBottom: 32,
          }}
        >
          <Kpi title="Bookings activos" value={metrics.activeBookingsCount} />
          <Kpi title="Próximos bookings" value={metrics.upcomingBookingsCount} />
          <Kpi title="Gastos previstos" value={`${metrics.expectedSpent} €`} />
          <Kpi title="Gastos confirmados" value={`${metrics.confirmedSpent} €`} />
          <Kpi
            title="Acciones pendientes"
            value={metrics.pendingActionsCount}
          />
        </section>

        {/* Próximos bookings */}
        <section>
          <h2>Próximos bookings</h2>

          {upcomingBookings.length === 0 && (
            <p>No hay bookings próximos</p>
          )}

          <ul style={{ marginTop: 16 }}>
            {upcomingBookings.map((booking) => (
              <li
                key={booking.bookingId}
                style={{
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              >
                <strong>{booking.artistName}</strong>
                <div>Fecha: {booking.startDate}</div>
                <div>Estado: {booking.status}</div>
                <div>
                  Caché: {booking.totalAmount} {booking.currency}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}

export default withRole(VenueDashboardPage, ['VENUE']);

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
      <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
        {value}
      </div>
    </div>
  );
}
