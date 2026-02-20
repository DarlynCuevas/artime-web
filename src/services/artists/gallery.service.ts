const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getArtistGallery(artistId: string) {
  const res = await fetch(`${API_BASE_URL}/artists/${artistId}/gallery`);
  if (!res.ok) {
    throw new Error('No se pudo cargar la galería');
  }
  return res.json();
}

export async function uploadArtistGalleryImage(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/artists/gallery`, {
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

export async function deleteArtistGalleryImage(itemId: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/artists/gallery/${itemId}`, {
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
