import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, AlertCircle, Calendar, Info, MapPin, DollarSign, Clock } from 'lucide-react';
import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { useArtistAvailability } from '@/hooks/artists/useArtistAvailability';
import { createArtistCalendarBlock, deleteArtistCalendarBlock, getArtistCalendarBlocks, getArtistBookingByDate } from '@/services/artists/calendar.service';
import { ArtistCalendar, CalendarDay } from '@/components/artists/calendar/ArtistCalendar';

function ArtistCalendarPage() {
  const { user } = useAuth();
  const { role, profileId } = useMe();
  const [month, setMonth] = useState(() => new Date());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { days: availabilityDays, loading } = useArtistAvailability(profileId, month, user?.token);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<any | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!user?.token) return;

    const from = new Date(Date.UTC(month.getFullYear(), month.getMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const to = new Date(Date.UTC(month.getFullYear(), month.getMonth() + 1, 0))
      .toISOString()
      .slice(0, 10);

    getArtistCalendarBlocks(from, to, user.token)
      .then((data) => {
        setBlockedDates(new Set((data ?? []).map((d: any) => d.date)));
      })
      .catch((err) => setError(err?.message || 'No se pudieron cargar los bloqueos'));
  }, [month, user?.token]);

  useEffect(() => {
    setError(null);
    setSelectedDate(null);
    setBookingDetail(null);
  }, [month]);

  const calendarDays: CalendarDay[] = useMemo(() => {
    const list: CalendarDay[] = availabilityDays.map((d) => ({
      date: d.date,
      status: d.status === 'BOOKED' ? 'BOOKED' : d.status === 'UNAVAILABLE' ? 'BLOCKED' : 'AVAILABLE',
      bookings: [],
    }));

    blockedDates.forEach((date) => {
      const existing = list.find((d) => d.date === date);
      if (existing) {
        existing.status = 'BLOCKED';
      } else {
        list.push({ date, status: 'BLOCKED', bookings: [] });
      }
    });

    return list;
  }, [availabilityDays, blockedDates]);

  const selectedDay = useMemo(
    () => (selectedDate ? calendarDays.find((d) => d.date === selectedDate) ?? null : null),
    [calendarDays, selectedDate],
  );

  useEffect(() => {
    setBookingDetail(null);
    if (!selectedDate || !user?.token) return;
    const day = calendarDays.find((d) => d.date === selectedDate);
    if (!day || day.status !== 'BOOKED') return;

    setBookingLoading(true);
    getArtistBookingByDate(selectedDate, user.token)
      .then((data) => setBookingDetail(data))
      .catch((err: any) => setError(err?.message || 'No se pudo cargar el booking'))
      .finally(() => setBookingLoading(false));
  }, [selectedDate, calendarDays, user?.token]);

  const handleBlock = async (date: string) => {
    if (!user?.token) return;
    setSubmitting(true);
    setError(null);
    try {
      await createArtistCalendarBlock(date, user.token);
      setBlockedDates((prev) => new Set(prev).add(date));
    } catch (err: any) {
      setError(err?.message || 'No se pudo bloquear el día');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = async (date: string) => {
    if (!user?.token) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteArtistCalendarBlock(date, user.token);
      setBlockedDates((prev) => {
        const next = new Set(prev);
        next.delete(date);
        return next;
      });
    } catch (err: any) {
      setError(err?.message || 'No se pudo desbloquear el día');
    } finally {
      setSubmitting(false);
    }
  };

  const nextMonth = () => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };

  if (!user || role !== 'ARTIST') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white">
        <div className="flex items-center gap-3 text-red-600 bg-red-50 px-6 py-4 rounded-2xl border border-red-100">
          <AlertCircle className="size-5" />
          <p className="font-black uppercase tracking-widest text-[11px]">Acceso no autorizado</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 bg-white min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-slate-900" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Artime OS • Availability</p>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Calendario</h1>
            <p className="text-slate-500 font-medium text-lg max-w-xl">Gestiona tu disponibilidad operativa y bloquea fechas críticas.</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button
            onClick={prevMonth}
            disabled={submitting}
            className="p-3 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all text-slate-600"
            title="Mes anterior"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="px-6 min-w-[180px] text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Periodo actual</p>
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
              {month.toLocaleString('es-ES', { month: 'long' })} {month.getFullYear()}
            </span>
          </div>
          <button
            onClick={nextMonth}
            disabled={submitting}
            className="p-3 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all text-slate-600"
            title="Mes siguiente"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-4 bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="size-5 shrink-0" />
          <p className="text-sm font-bold leading-tight">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-8 md:p-10 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Actualizando red de días...</p>
                </div>
              </div>
            )}
            <ArtistCalendar
              month={month.getMonth()}
              year={month.getFullYear()}
              days={calendarDays}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onBlockDay={submitting ? undefined : handleBlock}
              onUnblockDay={submitting ? undefined : handleUnblock}
            />
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-6 shadow-xl shadow-slate-200">
             <div className="space-y-2">
               <h2 className="text-xl font-black uppercase tracking-tight">Gestión Operativa</h2>
               <p className="text-slate-400 text-xs font-medium leading-relaxed">
                 Haz clic en un día para ver detalles o modificar su estado. El bloqueo es inmediato.
               </p>
             </div>
             <div className="space-y-3 pt-4 border-t border-white/10">
               <LegendItem color="bg-emerald-500" label="Disponible" />
               <LegendItem color="bg-slate-700" label="Bloqueado" />
               <LegendItem color="bg-slate-100" label="Confirmado" />
             </div>
          </div>

          {selectedDay && selectedDay.status === 'BOOKED' && (
            <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <header className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Detalle del Booking</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{selectedDay.date}</p>
                  </div>
                </div>
              </header>

              <div className="p-8">
                {bookingLoading ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="size-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Recuperando datos...</p>
                  </div>
                ) : bookingDetail ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <DetailRow icon={<Clock className="size-4" />} label="Estado" value={bookingDetail.status} highlight />
                      <DetailRow
                        icon={<DollarSign className="size-4" />}
                        label="Caché Pactado"
                        value={`${bookingDetail.totalAmount ?? '—'} ${bookingDetail.currency ?? ''}`}
                      />
                      <DetailRow
                        icon={<MapPin className="size-4" />}
                        label="Venue / Sala"
                        value={bookingDetail.venue ? `${bookingDetail.venue.name}${bookingDetail.venue.city ? ` · ${bookingDetail.venue.city}` : ''}` : '—'}
                      />
                    </div>
                    <Link
                      href={`/bookings/${bookingDetail.id || ''}`}
                      className="flex items-center justify-center w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-900 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl border border-slate-100 transition-all"
                    >
                      Ver contrato completo
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl text-red-600 border border-red-100">
                    <AlertCircle className="size-4" />
                    <p className="text-[11px] font-black uppercase tracking-widest">Error al cargar booking</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {!selectedDay && (
            <div className="p-8 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4 opacity-60">
               <Info className="size-8 text-slate-300" />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed">
                 Selecciona una fecha del<br />calendario para operar
               </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`size-3 rounded-full ${color} ring-4 ring-white/5`} />
      <span className="text-[11px] font-black uppercase tracking-widest text-white/70">{label}</span>
    </div>
  );
}

function DetailRow({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <div className="size-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className={`text-sm truncate leading-tight ${highlight ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default withRole(ArtistCalendarPage, ['ARTIST']);
