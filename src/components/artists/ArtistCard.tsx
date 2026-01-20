type ArtistCardProps = {
  artist: {
    artistId: string
    name: string
    city: string
    basePrice: number
    currency: string
  }
  onViewProfile: (artistId: string) => void
}

export function ArtistCard({
  artist,
  onViewProfile,
}: ArtistCardProps) {
  return (
    <section
      style={{
        border: '1px solid #ddd',
        padding: 16,
        marginBottom: 12,
        borderRadius: 6,
      }}
    >
      <p>
        <strong>{artist.name}</strong>
      </p>

      <p>
        {artist.city} · Base:{' '}
        {artist.basePrice} {artist.currency}
      </p>

      <p style={{ color: '#666', fontSize: 13 }}>
        Este artista puede ser seleccionado para
        iniciar una propuesta de contratación.
      </p>

      <button
        onClick={() => onViewProfile(artist.artistId)}
        style={{ marginTop: 8 }}
      >
        Ver perfil
      </button>
    </section>
  )
}
