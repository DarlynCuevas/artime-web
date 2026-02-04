import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/auth/useAuth';
import { useArtists } from '@/hooks/artists/useArtists';
import { eventsService } from '@/services/events/events.service';
import {
  getArtistAvailability,
  getArtistProfileById,
} from '@/services/artists/artists.service';
import type { Event } from '@/types/event';

type Filters = {
  date?: string;
  budget?: string;
};

export default function EventSearchArtistsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { artists, artistsLoading, artistsError } = useArtists();

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [filteredArtists, setFilteredArtists] = useState<any[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [filterApplied, setFilterApplied] = useState(false);
  const [profilesById, setProfilesById] = useState<
    Record<string, any>
  >({});
  const autoFilteredRef = useRef(false);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    if (!user?.token) return;

    setLoadingEvent(true);
    eventsService
      .getEvent(id, user.token)
      .then((data) => {
        setEvent(data);
        setFilters({
          date: data.start_date
            ? new Date(data.start_date).toISOString().slice(0, 10)
            : '',
          budget:
            data.estimatedBudget !== null &&
            data.estimatedBudget !== undefined
              ? String(data.estimatedBudget)
              : '',
        });
      })
      .finally(() => setLoadingEvent(false));
  }, [id, user?.token]);

  useEffect(() => {
    if (!user?.token || artists.length === 0) return;

    Promise.all(
      artists.map((artist) =>
        getArtistProfileById(artist.id, user.token)
          .then((profile) => ({ id: artist.id, profile }))
          .catch(() => null)
      )
    ).then((rows) => {
      const nextMap: Record<string, any> = {};
      rows.forEach((row) => {
        if (row) nextMap[row.id] = row.profile;
      });
      setProfilesById(nextMap);
    });
  }, [artists, user?.token]);

  const visibleArtists = useMemo(() => {
    return filterApplied ? filteredArtists : artists;
  }, [filterApplied, filteredArtists, artists]);

  async function handleInvite(artistId: string) {
    if (!event || !user?.token) return;
    setSendingId(artistId);
    try {
      await eventsService.sendInvitation(event.id, artistId, user.token);
    } finally {
      setSendingId(null);
    }
  }

  async function applyAvailabilityFilter(date: string) {
    if (!user?.token) return;
    setFiltering(true);
    setFilterError(null);

    try {
      const checks = await Promise.all(
        artists.map(async (artist) => {
          const availability = await getArtistAvailability(
            artist.id,
            date,
            date,
            user.token
          );
          const day = availability?.days?.[0];
          return day?.status === 'AVAILABLE' ? artist : null;
        })
      );
      setFilteredArtists(checks.filter(Boolean) as any[]);
      setFilterApplied(true);
    } catch (err: any) {
      setFilterError(
        err?.message || 'No se pudo aplicar el filtro',
      );
    } finally {
      setFiltering(false);
    }
  }

  async function handleApplyFilters() {
    if (!user?.token) return;
    setFiltering(true);
    setFilterError(null);

    try {
      let current = [...artists];
      const budget = filters.budget
        ? Number(filters.budget)
        : null;

      if (budget !== null && !Number.isNaN(budget)) {
        current = current.filter((artist) => {
          const profile = profilesById[artist.id];
          if (!profile || profile.basePrice === undefined || profile.basePrice === null) {
            return false;
          }
          return Number(profile.basePrice) <= budget;
        });
      }

      if (filters.date) {
        const checks = await Promise.all(
          current.map(async (artist) => {
            const availability = await getArtistAvailability(
              artist.id,
              filters.date as string,
              filters.date as string,
              user.token
            );
            const day = availability?.days?.[0];
            return day?.status === 'AVAILABLE' ? artist : null;
          })
        );
        current = checks.filter(Boolean) as any[];
      }

      setFilteredArtists(current);
      setFilterApplied(true);
    } catch (err: any) {
      setFilterError(
        err?.message || 'No se pudo aplicar el filtro',
      );
    } finally {
      setFiltering(false);
    }
  }

  useEffect(() => {
    if (autoFilteredRef.current) return;
    if (!user?.token || artists.length === 0) return;
    if (!filters.date) return;
    autoFilteredRef.current = true;
    void applyAvailabilityFilter(filters.date);
  }, [artists, filters.date, user?.token]);

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: '#666', marginBottom: 4 }}>
          Buscar artistas para este evento
        </p>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>
          {event?.name ?? 'Evento'}
        </h1>
        <p style={{ color: '#555' }}>
          Filtra artistas disponibles y envía invitaciones.
        </p>
      </header>

      {loadingEvent && <p>Cargando evento…</p>}

      {!loadingEvent && event && (
        <section
          style={{
            border: '1px solid #ddd',
            padding: 16,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>
            Filtros prellenados
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#666' }}>
                Fecha
              </span>
              <input
                type="date"
                value={filters.date ?? ''}
                onChange={(e) =>
                  setFilters({ ...filters, date: e.target.value })
                }
                style={{ padding: 8, border: '1px solid #ddd' }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#666' }}>
                Presupuesto estimado
              </span>
              <input
                type="number"
                value={filters.budget ?? ''}
                onChange={(e) =>
                  setFilters({ ...filters, budget: e.target.value })
                }
                style={{ padding: 8, border: '1px solid #ddd' }}
              />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              onClick={handleApplyFilters}
              disabled={filtering}
              style={{
                padding: '8px 12px',
                background: '#000',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {filtering ? 'Aplicando…' : 'Aplicar filtros'}
            </button>
          </div>
          {filterError && (
            <p style={{ color: 'red', marginTop: 8 }}>
              {filterError}
            </p>
          )}
        </section>
      )}

      <section>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          Artistas disponibles
        </h2>

        {artistsLoading && <p>Cargando artistas…</p>}
        {artistsError && (
          <p style={{ color: 'red' }}>
            No se pudieron cargar los artistas
          </p>
        )}

        {!artistsLoading && !artistsError && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {visibleArtists.map((artist) => (
              <div
                key={artist.id}
                style={{
                  border: '1px solid #ddd',
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {artist.name}
                </div>
                {profilesById[artist.id]?.basePrice !== undefined && (
                  <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                    Desde {profilesById[artist.id].basePrice}{' '}
                    {profilesById[artist.id].currency ?? ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <a
                    href={`/artists/profile/${artist.id}`}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      color: '#111',
                      textDecoration: 'none',
                      fontSize: 12,
                    }}
                  >
                    Ver perfil
                  </a>
                  <button
                    onClick={() => handleInvite(artist.id)}
                    disabled={sendingId === artist.id}
                    style={{
                      padding: '8px 12px',
                      background: '#000',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {sendingId === artist.id
                      ? 'Enviando…'
                      : 'Invitar artista'}
                  </button>
                </div>
              </div>
            ))}
            {filterApplied && visibleArtists.length === 0 && (
              <div style={{ color: '#666', fontSize: 14 }}>
                No hay artistas disponibles para esta fecha.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
