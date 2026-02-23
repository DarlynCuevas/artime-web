import { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ExternalLink, Lock, MapPin, Unlock, Users } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { AvailabilityCalendar } from '@/components/profile/AvailabilityCalendar';
import { useAuth } from '@/hooks/auth/useAuth';
import { getPublicArtistCalendarBlocks } from '@/services/artists/calendar.service';
import { getMyRepresentedArtists } from '@/services/managers/managers.service';

type RepresentedArtist = {
  id: string;
  name: string;
};

type BookingRow = {
  id: string;
  artistId: string | null;
  artistName: string;
  venueName?: string | null;
  eventName?: string | null;
  city?: string | null;
  startDate: string;
  status: string;
  totalAmount?: number | null;
  currency?: string | null;
};

type RawBooking = {
  id?: string;
  artistId?: string | null;
  artistName?: string | null;
  venueName?: string | null;
  eventName?: string | null;
  city?: string | null;
  start_date?: string;
  status?: string;
  totalAmount?: number | null;
  currency?: string | null;
};

type RepresentedArtistApi = {
  id: string;
  name?: string | null;
};

type CalendarBlock = {
  date: string;
};

function ManagerCalendarPage() {
  const { user } = useAuth();

  const [artists, setArtists] = useState<RepresentedArtist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [representedData, bookingsRes] = await Promise.all([
          getMyRepresentedArtists(user.token),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        if (!bookingsRes.ok) throw new Error('No se pudo cargar el calendario');
        const bookingsData = (await bookingsRes.json()) as RawBooking[];

        const represented = (Array.isArray(representedData) ? representedData : [])
          .filter((item: unknown): item is RepresentedArtistApi => {
            return Boolean(item && typeof item === 'object' && 'id' in item);
          })
          .map((item) => ({ id: item.id, name: item.name ?? 'Artista' }));

        const representedIds = new Set(represented.map((artist) => artist.id));
        const normalizedBookings = (Array.isArray(bookingsData) ? bookingsData : [])
          .filter((item) => item?.id && item?.start_date && item?.status)
          .map((item) => ({
            id: item.id as string,
            artistId: item.artistId ?? null,
            artistName: item.artistName ?? 'Artista',
            venueName: item.venueName ?? null,
            eventName: item.eventName ?? null,
            city: item.city ?? null,
            startDate: item.start_date as string,
            status: item.status as string,
            totalAmount: item.totalAmount ?? null,
            currency: item.currency ?? 'EUR',
          }))
          .filter((item) => !item.artistId || representedIds.has(item.artistId));

        setArtists(represented);
        setSelectedArtistId((current) => current || represented[0]?.id || '');
        setBookings(normalizedBookings);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el calendario');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.token]);

  useEffect(() => {
    if (!selectedArtistId || !user?.token) {
      setBlockedDates(new Set());
      return;
    }

    setLoadingBlocks(true);
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().slice(0, 10);
    getPublicArtistCalendarBlocks(selectedArtistId, from, to, user.token)
      .then((data: CalendarBlock[]) => setBlockedDates(new Set((data ?? []).map((entry) => entry.date))))
      .catch(() => setBlockedDates(new Set()))
      .finally(() => setLoadingBlocks(false));
  }, [selectedArtistId, user?.token]);

  const selectedArtist = useMemo(
    () => artists.find((artist) => artist.id === selectedArtistId) ?? null,
    [artists, selectedArtistId],
  );

  const selectedBooking = useMemo(() => {
    if (!selectedDate || !selectedArtistId) return null;
    return (
      bookings.find((booking) => {
        if (!booking.artistId || booking.artistId !== selectedArtistId) return false;
        return booking.startDate.slice(0, 10) === selectedDate;
      }) ?? null
    );
  }, [bookings, selectedArtistId, selectedDate]);

  const isSelectedBlocked = selectedDate ? blockedDates.has(selectedDate) : false;
  const isSelectedBooked = Boolean(selectedBooking);
  const isSelectedFree = selectedDate && !isSelectedBlocked && !isSelectedBooked;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-pulse">
            <CalendarIcon className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20 selection:bg-amber-500/30 selection:text-amber-900">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-200/20 rounded-full blur-3xl opacity-50 mix-blend-multiply" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Gestión de Calendario</h1>
          <p className="text-slate-600 font-medium text-sm sm:text-base max-w-2xl leading-relaxed">
            Consulta la disponibilidad de tus artistas representados y revisa en detalle cada fecha.
          </p>
        </header>

        <section className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 inline-flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Artista representado
            </label>
            <select
              value={selectedArtistId}
              onChange={(event) => {
                setSelectedArtistId(event.target.value);
                setSelectedDate(null);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none"
            >
              {artists.length === 0 && <option value="">Sin artistas</option>}
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {selectedArtistId ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
              <AvailabilityCalendar
                artistId={selectedArtistId}
                token={user?.token}
                interactiveMode={true}
                onDayClick={setSelectedDate}
              />
            </div>

            <div className="lg:col-span-4 space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Operaciones de Fecha</h2>

              {!selectedDate && (
                <div className="bg-slate-100/50 border border-slate-200/50 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-4">
                    <CalendarIcon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Ningún día seleccionado</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Selecciona un día para ver si está libre, bloqueado o reservado para {selectedArtist?.name ?? 'el artista'}.
                  </p>
                </div>
              )}

              {selectedDate && (
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100/80 bg-slate-50/50 flex flex-col justify-center items-center text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Fecha Seleccionada</span>
                    <h3 className="text-2xl font-black text-slate-900">
                      {new Date(selectedDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </h3>
                  </div>

                  {isSelectedBlocked && (
                    <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-2">Día Bloqueado</h4>
                      <p className="text-sm text-slate-500 mb-8 font-medium">
                        {selectedArtist?.name ?? 'El artista'} marcó esta fecha como no disponible.
                      </p>
                      <button
                        type="button"
                        disabled={true}
                        className="w-full flex items-center justify-center gap-2 h-12 bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm rounded-xl opacity-70 cursor-not-allowed"
                      >
                        <Unlock className="w-4 h-4" />
                        Desbloquear Disponibilidad
                      </button>
                      <p className="text-[10px] text-slate-400 mt-2">Solo el artista puede cambiar este estado desde su calendario.</p>
                    </div>
                  )}

                  {isSelectedFree && !loadingBlocks && (
                    <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 border border-amber-100">
                        <Unlock className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-2">Día Libre</h4>
                      <p className="text-sm text-slate-500 mb-8 font-medium">
                        Fecha disponible para nuevas propuestas.
                      </p>
                      <button
                        type="button"
                        disabled={true}
                        className="w-full flex items-center justify-center gap-2 h-12 bg-slate-900 text-white font-bold text-sm rounded-xl opacity-70 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4 opacity-80" />
                        Bloquear Disponibilidad
                      </button>
                      <p className="text-[10px] text-slate-400 mt-2">Solo el artista puede bloquear o desbloquear fechas.</p>
                    </div>
                  )}

                  {isSelectedBooked && selectedBooking && (
                    <div className="p-0">
                      <div className="p-6 bg-slate-900 text-white flex flex-col items-center text-center relative overflow-hidden">
                        <div className="relative z-10 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                          <CalendarIcon className="w-8 h-8 text-amber-400" />
                        </div>
                        <h4 className="font-bold text-xl relative z-10 mb-1">Día Ocupado</h4>
                        <p className="text-sm text-slate-300 font-medium relative z-10">
                          Existe una actuación confirmada
                        </p>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</span>
                          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-emerald-100 text-emerald-700">
                            {selectedBooking.status}
                          </span>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MapPin className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {selectedBooking.eventName || selectedBooking.venueName || 'Booking'}
                            </p>
                            {selectedBooking.city && (
                              <p className="text-xs font-medium text-slate-500 mt-0.5">{selectedBooking.city}</p>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 mt-2 border-t border-slate-100">
                          <button
                            onClick={() => (window.location.href = '/manager/bookings')}
                            className="w-full h-10 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            Ver en bookings del manager
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No tienes artistas representados para visualizar su calendario.
          </div>
        )}
      </main>
    </div>
  );
}

export default withRole(ManagerCalendarPage, ['MANAGER']);
