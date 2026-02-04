import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { useArtistNotifications } from '@/hooks/artists/useArtistNotifications';
import type { ArtistNotification } from '@/services/notifications/artist-notifications.service';
import { formatCurrency } from '@/lib/utils';
import { resolveRepresentationRequest } from '@/services/representations/representations.service';
import { ConfirmActionModal } from '@/components/representations/ConfirmActionModal';

export default function ArtistSolicitudesPage() {
  const { user } = useAuth();
  const { role, loading: meLoading } = useMe();

  const { notifications, unreadCount, loading, markAsRead } = useArtistNotifications({
    userId: user?.id,
    role: role ?? undefined,
    token: user?.token,
    limit: 100,
  });

  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'ACCEPT' | 'REJECT'; managerName?: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const actionableRequests = useMemo(
    () => notifications.filter((n) => n.type === 'REPRESENTATION_REQUEST_CREATED'),
    [notifications],
  );

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
                  : n.type === 'REPRESENTATION_REQUEST_CREATED'
                    ? 'Solicitud de representación'
                    : n.type === 'REPRESENTATION_REQUEST_RESOLVED'
                      ? `Respuesta a tu solicitud: ${n.payload?.result ?? ''}`
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
            {n.type === 'REPRESENTATION_REQUEST_CREATED' && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, color: '#111' }}>
                  Manager: {n.payload?.managerName ?? '—'} · Comisión propuesta: {n.payload?.commissionPercentage ?? '—'}%
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setPendingAction({ id: n.payload?.requestId, action: 'ACCEPT', managerName: n.payload?.managerName })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #0f172a',
                      background: '#0f172a',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => setPendingAction({ id: n.payload?.requestId, action: 'REJECT', managerName: n.payload?.managerName })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #e11d48',
                      background: '#fff',
                      color: '#e11d48',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            )}
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

      <ConfirmActionModal
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        title={pendingAction?.action === 'ACCEPT' ? 'Aceptar representación' : 'Rechazar representación'}
        description={
          pendingAction?.action === 'ACCEPT'
            ? 'Al aceptar se activará una representación profesional y contractual en ARTIME.'
            : 'Esta solicitud quedará rechazada y el manager será notificado.'
        }
        confirmLabel={pendingAction?.action === 'ACCEPT' ? 'Confirmar aceptación' : 'Confirmar rechazo'}
        tone={pendingAction?.action === 'ACCEPT' ? 'primary' : 'danger'}
        loading={actionLoading}
        onConfirm={async () => {
          if (!pendingAction || !user?.token) return;
          setActionLoading(true);
          try {
            await resolveRepresentationRequest({ requestId: pendingAction.id, action: pendingAction.action, token: user.token });
            setPendingAction(null);
          } catch (err) {
            alert((err as Error)?.message ?? 'No se pudo resolver la solicitud');
          } finally {
            setActionLoading(false);
          }
        }}
        footer={pendingAction?.managerName ? <p className="text-sm text-slate-700">Manager: {pendingAction.managerName}</p> : null}
      />
    </main>
  );
}
