const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getPromoterGallery(promoterId: string) {
  const res = await fetch(`${API_BASE_URL}/promoters/${promoterId}/gallery`);
  if (!res.ok) {
    throw new Error('No se pudo cargar la galería');
  }
  return res.json();
}

export async function uploadPromoterGalleryImage(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/promoters/gallery`, {
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

export async function deletePromoterGalleryImage(itemId: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/promoters/gallery/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('No se pudo eliminar la imagen');
  }

  return res.json();
}
