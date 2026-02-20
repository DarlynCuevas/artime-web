const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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

export async function uploadProfileImage(file: File, token: string): Promise<{ ok: boolean; path?: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/users/profile-image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error('No se pudo subir la imagen');
  }

  return res.json();
}
