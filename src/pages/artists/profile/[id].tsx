import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, MapPin, Music, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useArtistAvailability } from '@/hooks/artists/useArtistAvailability';
import { getPublicArtistCalendarBlocks } from '@/services/artists/calendar.service';

type ArtistProfile = {
  id: string;
  name: string;
  city: string;
  genres: string[];
  bio?: string;
  format?: string;
  basePrice: number;
  currency: string;
  isNegotiable: boolean;
  managerId?: string;
};

type DayStatus = 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE';

export default function ArtistProfilePage() {
  const router = useRouter();
  const { id, date } = router.query as { id: string; date?: string };
  const { user } = useAuth();

  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<Date>(new Date());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());

  const { days: availability, loading: availabilityLoading } =
  useArtistAvailability(id, month, user?.token);

  useEffect(() => {
    if (!id || !user?.token) return;

    const from = new Date(Date.UTC(month.getFullYear(), month.getMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const to = new Date(Date.UTC(month.getFullYear(), month.getMonth() + 1, 0))
      .toISOString()
      .slice(0, 10);

    getPublicArtistCalendarBlocks(id, from, to, user.token)
      .then((data) => setBlockedDates(new Set((data ?? []).map((d: any) => d.date))))
      .catch(() => setBlockedDates(new Set()));
  }, [id, month, user?.token]);
  useEffect(() => {
    if (!id || !user?.token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/${id}`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((r) => r.json())
      .then(setArtist)
      .finally(() => setLoading(false));
  }, [id, user?.token]);

  if (loading) {
    return <p className="p-8">Cargando artista…</p>;
  }

  if (!artist) {
    return <p className="p-8">Artista no encontrado</p>;
  }

  const handleBooking = (bookingDate?: string) => {
    router.push(
      bookingDate
        ? `/bookings/new?artistId=${id}&date=${bookingDate}`
        : `/bookings/new?artistId=${id}`,
    );
  };

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <Link
        href="/venues/discover"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a artistas
      </Link>

      <div className="action-panel">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-lg bg-slate-100 overflow-hidden shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{artist.name}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {artist.city}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {artist.genres?.map((genre) => (
                <span
                  key={genre}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-xs text-slate-600"
                >
                  <Music className="h-3 w-3" />
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="action-panel">
            <h2 className="font-semibold text-slate-900 mb-3">Biografía</h2>
            <p className="text-slate-600 leading-relaxed">
              {artist.bio || 'No hay descripción profesional registrada.'}
            </p>
          </section>

          <section className="action-panel">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Disponibilidad
            </h2>

            {availabilityLoading && (
              <p className="text-sm text-slate-500">Cargando disponibilidad…</p>
            )}

            {!availabilityLoading && availability.length === 0 && (
              <p className="text-sm text-slate-500">No hay información de disponibilidad para este mes.</p>
            )}

            {!availabilityLoading && availability.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-2">
                  {availability.map((day) => {
                    const isBlocked = blockedDates.has(day.date);
                    const status = isBlocked ? 'UNAVAILABLE' : day.status;
                    const baseClasses = 'rounded-lg px-2 py-3 text-center text-sm transition';
                    const statusClasses =
                      status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100'
                        : status === 'BOOKED'
                          ? 'bg-slate-200 text-slate-600 cursor-not-allowed line-through'
                          : 'bg-slate-100 text-slate-500 cursor-not-allowed';

                    return (
                      <div
                        key={day.date}
                        className={`${baseClasses} ${statusClasses}`}
                        onClick={() => {
                          if (status !== 'AVAILABLE') return;
                          handleBooking(day.date);
                        }}
                      >
                        {day.date.slice(8, 10)}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-200" /> Disponible
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-slate-200" /> Reservado
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-slate-100" /> No disponible
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-3">
              La disponibilidad es orientativa. La contratación solo se confirma mediante un booking en ARTIME.
            </p>
          </section>

          <section className="action-panel bg-slate-50 border-l-4 border-l-slate-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-slate-500 mt-0.5" />
              <p className="text-sm text-slate-600">
                La información de este perfil es descriptiva y no constituye un acuerdo contractual.
              </p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="action-panel">
            <h2 className="font-semibold text-slate-900 mb-3">Condiciones económicas</h2>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(artist.basePrice, artist.currency)}
                </p>
                <p className="text-sm text-slate-500">Caché base</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${artist.isNegotiable ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                >
                  {artist.isNegotiable ? 'Negociable' : 'No negociable'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Las condiciones finales se definen mediante booking en ARTIME.
              </p>
            </div>
          </section>

          <section className="action-panel space-y-3">
            <h2 className="font-semibold text-slate-900">Iniciar contratación</h2>
            <p className="text-sm text-slate-600">Selecciona una fecha disponible para continuar con la propuesta.</p>
            <button
              type="button"
              onClick={() => handleBooking(date)}
              className="w-full inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
            >
              Iniciar contratación
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}
