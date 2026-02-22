const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getPromoterVideos(promoterId: string) {
  const res = await fetch(`${API_BASE_URL}/promoters/${promoterId}/videos`);
  if (!res.ok) {
    throw new Error('No se pudo cargar los videos');
  }
  return res.json();
}

export async function addPromoterVideo(url: string, token: string, title?: string) {
  const res = await fetch(`${API_BASE_URL}/promoters/videos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, title }),
  });

  if (!res.ok) {
    throw new Error('No se pudo añadir el video');
  }

  return res.json();
}

export async function deletePromoterVideo(itemId: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/promoters/videos/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('No se pudo eliminar el video');
  }

  return res.json();
}
