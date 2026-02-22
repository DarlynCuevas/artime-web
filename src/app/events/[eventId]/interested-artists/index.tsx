'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { createBooking } from '@/services/bookings/bookings.service';

function EventInterestedArtistsPage() {
  const params = useParams()!;
  const eventId = (params?.eventId ?? '') as string;
  const { user } = useAuth();

  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token || !eventId) return;

    setLoading(true);

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/interested-artists`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      },
    )
      .then((res) => res.json())
      .then((data) => {
        setArtists(data);
      })
      .finally(() => setLoading(false));
  }, [eventId, user?.token]);

  const createBookingForArtist = async (artistId: string) => {
    if (!user?.token) return;
    setCreatingId(artistId);
    try {
      await createBooking(
        {
          eventId,
          artistId,
        },
        user.token,
      );
    } finally {
      setCreatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Cargando artistas interesados…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">
          Artistas interesados
        </h1>
        <p className="text-slate-600">
          Artistas que han aceptado tu invitación para este evento.
        </p>
      </header>

      {artists.length === 0 ? (
        <p className="text-slate-500">
          Todavía no hay artistas interesados.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {artists.map((artist) => (
            <div
              key={artist.artistId}
              className="rounded-xl border border-slate-200 bg-white p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {artist.name}
                </p>
                <p className="text-sm text-slate-500">
                  {artist.location}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Géneros: {artist.genres.join(', ')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={artist.status} />
                <button
                  onClick={() =>
                    createBookingForArtist(artist.artistId)
                  }
                  disabled={creatingId === artist.artistId}
                  className="px-4 py-2 rounded bg-black text-white text-sm"
                >
                  {creatingId === artist.artistId
                    ? 'Creando…'
                    : 'Crear booking'}
                </button>
                <a
                  href={`/artists/profile/${artist.artistId}`}
                  className="px-3 py-2 rounded border text-sm"
                >
                  Ver perfil
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default withRole(EventInterestedArtistsPage, ['PROMOTER', 'VENUE']);
