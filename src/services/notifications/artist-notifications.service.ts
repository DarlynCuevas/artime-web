const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type ArtistNotification = {
  id: string;
  artist_id?: string | null;
  user_id?: string | null;
  role?: string | null;
  type: string;
  payload: Record<string, any>;
  status: 'UNREAD' | 'READ';
  created_at: string;
};

export async function getArtistNotifications(token: string, limit = 50, role?: string): Promise<ArtistNotification[]> {
  const roleQuery = role ? `&role=${encodeURIComponent(role)}` : '';
  const url = `${API_BASE_URL}/notifications?limit=${limit}${roleQuery}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudieron cargar las notificaciones');
  }

  return res.json();
}

export async function markNotificationRead(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo marcar la notificación como leída');
  }
}
