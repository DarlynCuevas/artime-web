const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
type UserRole = 'ARTIST' | 'VENUE' | 'PROMOTER' | 'MANAGER' | 'ADMIN';

export async function getProfileImage(token: string): Promise<{ url: string | null }> {
  const res = await fetch(`${API_BASE_URL}/users/profile-image`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('No se pudo obtener la imagen de perfil');
  }

  return res.json();
}

export async function uploadProfileImage(
  file: File,
  token: string,
  role?: UserRole,
): Promise<{ ok: boolean; path?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (role) {
    formData.append('role', role);
  }

  const res = await fetch(`${API_BASE_URL}/users/profile-image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || 'No se pudo subir la imagen');
  }

  return res.json();
}
