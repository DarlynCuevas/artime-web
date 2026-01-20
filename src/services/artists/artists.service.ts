// web/src/services/artists/artists.service.ts

export async function getArtists(token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/artists`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Error fetching artists');
  }

  return res.json();
}

export async function discoverArtists(token: string) {
  console.log('llamada al back');
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/discover`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('DISCOVER_ARTISTS_FAILED');
  }

  return res.json();
}
