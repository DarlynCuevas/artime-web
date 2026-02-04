import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { useArtistNotifications } from '@/hooks/artists/useArtistNotifications';
import { useEffect } from 'react';
import type { ArtistNotification } from '@/services/notifications/artist-notifications.service';
import { formatCurrency } from '@/lib/utils';

export default function ArtistSolicitudesPage() {
  const { user } = useAuth();
  const { role, loading: meLoading } = useMe();

  const { notifications, unreadCount, loading, markAsRead } = useArtistNotifications({
    userId: user?.id,
    role: role ?? undefined,
    token: user?.token,
    limit: 100,
  });

  useEffect(() => {
    if (!meLoading && user && role !== 'ARTIST') {
      // Solo artistas
      window.location.href = '/';
    }
  }, [meLoading, role, user]);

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1>Solicitudes</h1>
        <p style={{ color: '#555' }}>Notificaciones y convocatorias recibidas.</p>
        {unreadCount > 0 && (
          <p style={{ color: '#0f172a', fontWeight: 600 }}>Tienes {unreadCount} sin leer.</p>
        )}
      </header>

      {loading && <p>Cargando notificaciones…</p>}

      {!loading && notifications.length === 0 && (
        <p style={{ color: '#666' }}>No tienes notificaciones por ahora.</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {notifications.map((n: ArtistNotification) => (
          <div
            key={n.id}
            style={{
              border: '1px solid #ddd',
              padding: 14,
              borderRadius: 8,
              background: n.status === 'UNREAD' ? '#f6fbff' : '#fff',
              display: 'grid',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {n.type === 'ARTIST_CALL_CREATED'
                ? 'Nueva convocatoria'
                : n.type === 'EVENT_INVITATION_CREATED'
                  ? `${n.payload?.eventName ?? n.payload?.event?.name ?? 'Invitación a evento'}${n.payload?.eventName || n.payload?.event?.name ? ' te ha invitado a su evento' : ''}`
                  : n.type}
            </div>
            <div style={{ fontSize: 13, color: '#333' }}>
              {n.payload?.venueName ? `${n.payload.venueName} · ` : ''}
              {n.payload?.city ?? ''}
            </div>
            <div style={{ fontSize: 13, color: '#333' }}>
              {n.payload?.date ?? ''}
              {(() => {
                const minP = n.payload?.offeredMinPrice;
                const maxP = n.payload?.offeredMaxPrice;
                if (minP && maxP) return ` · Presupuesto: ${formatCurrency(minP, 'EUR')} - ${formatCurrency(maxP, 'EUR')}`;
                if (maxP) return ` · Presupuesto hasta ${formatCurrency(maxP, 'EUR')}`;
                if (minP) return ` · Presupuesto desde ${formatCurrency(minP, 'EUR')}`;
                return '';
              })()}
            </div>
            {n.status === 'UNREAD' && (
              <button
                onClick={() => markAsRead(n.id)}
                style={{
                  marginTop: 8,
                  width: 'fit-content',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #0f172a',
                  background: '#0f172a',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Marcar como leída
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
