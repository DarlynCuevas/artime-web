export async function discoverArtists(
  token: string,
  params: {
    date: string
    city?: string
    genre?: string
    minPrice?: number
    maxPrice?: number
    search?: string
  },
) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as any,
  ).toString()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/venues/discover/artists?${query}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!res.ok) {
    throw new Error('DISCOVER_ARTISTS_FAILED')
  }

  return res.json()
}
