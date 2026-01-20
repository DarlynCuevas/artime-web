import { discoverArtists } from '@/services/artists/discoverArtists.service'
import { useEffect, useState } from 'react'
import { useAuth } from '../useAuth'

export function useDiscoverArtists(filters: {
  date: string
  city?: string
  genre?: string
  minPrice?: number
  maxPrice?: number
  search?: string
}) {
  const [artists, setArtists] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!filters.date || !user?.token) return

    setLoading(true)

    discoverArtists(user.token, filters)
      .then(setArtists)
      .finally(() => setLoading(false))
  }, [JSON.stringify(filters), user?.token])

  return { artists, loading }
}
