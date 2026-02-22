import { useEffect, useState } from 'react';
import { Lock, Unlock, Calendar as CalendarIcon, Loader2, Info, MapPin, ExternalLink, Euro } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';

import {
  createArtistCalendarBlock,
  deleteArtistCalendarBlock,
  getPublicArtistCalendarBlocks,
  getArtistBookingByDate
} from '@/services/artists/calendar.service';

import { AvailabilityCalendar } from '@/components/profile/AvailabilityCalendar';

function ArtistCalendarPage() {
  const { user } = useAuth();
  const { role, profileId } = useMe();

  // Estado para la fecha seleccionada en el AvailabilityCalendar
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Estados visuales y de datos
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [bookingDetail, setBookingDetail] = useState<any | null>(null);

  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todos los bloqueos actuales del artista para saber si el día seleccionado está bloqueado
  // (El AvailabilityCalendar hace la suyas internamente por mes, pero necesitamos saberlo a nivel global para el botón)
  useEffect(() => {
    if (!profileId || !user?.token) return;
    setLoadingBlocks(true);
    // Pedimos un rango amplio para tener en memoria los bloqueos
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().slice(0, 10);

    getPublicArtistCalendarBlocks(profileId, from, to, user.token)
      .then((data) => {
        setBlockedDates(new Set((data ?? []).map((d: any) => d.date)));
      })
      .catch((err) => console.error("Error cargando bloqueos globales", err))
      .finally(() => setLoadingBlocks(false));
  }, [profileId, user?.token]);

  // Manejar selección de día
  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setError(null);
    setBookingDetail(null);
  };

  // Cargar detalle de booking si aplica
  useEffect(() => {
    if (!selectedDate || !user?.token || blockedDates.has(selectedDate)) {
      setBookingDetail(null);
      return;
    }

    // Intentamos cargar el booking ese día
    setLoadingBooking(true);
    getArtistBookingByDate(selectedDate, user.token)
      .then((data) => {
        if (data && data.status) {
          setBookingDetail(data);
        } else {
          setBookingDetail(null);
        }
      })
      .catch((err: any) => {
        setBookingDetail(null); // Probablemente no hay booking, solo es un día libre
      })
      .finally(() => setLoadingBooking(false));
  }, [selectedDate, user?.token, blockedDates]);

  const handleBlock = async () => {
    if (!user?.token || !selectedDate) return;
    setSubmitting(true);
    setError(null);
    try {
      await createArtistCalendarBlock(selectedDate, user.token);
      setBlockedDates((prev) => new Set(prev).add(selectedDate));
      // Forzar un mini-refresh visual desactivando y activando la fecha para que el hijo AvailabilityCalendar lo note si estuviera sincronizado por contexto (usualmente se re-pide, pero recargará su refetch).
    } catch (err: any) {
      setError(err?.message || 'No se pudo bloquear el día');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = async () => {
    if (!user?.token || !selectedDate) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteArtistCalendarBlock(selectedDate, user.token);
      setBlockedDates((prev) => {
        const next = new Set(prev);
        next.delete(selectedDate);
        return next;
      });
    } catch (err: any) {
      setError(err?.message || 'No se pudo desbloquear el día');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || role !== 'ARTIST') {
    return <div className="p-8 text-center text-slate-500">Acceso no autorizado</div>;
  }

  const isSelectedBlocked = selectedDate ? blockedDates.has(selectedDate) : false;
  const isSelectedBooked = !!bookingDetail;
  const isSelectedFree = selectedDate && !isSelectedBlocked && !isSelectedBooked;

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20 selection:bg-amber-500/30 selection:text-amber-900">

      {/* Background Decorativo */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-200/20 rounded-full blur-3xl opacity-50 mix-blend-multiply" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* HERO */}
        <header className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Gestión de Calendario
          </h1>
          <p className="text-slate-600 font-medium text-sm sm:text-base max-w-2xl leading-relaxed">
            Define tu disponibilidad interactuando con las fechas. Bloquea días para descansar o evitar nuevas propuestas de salas y promotores.
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-medium text-rose-700 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <span className="text-rose-600 font-bold">!</span>
            </div>
            {error}
          </div>
        )}

        {/* LAYOUT PRINCIPAL (2 COLUMNAS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* COLUMNA IZQUIERDA: CALENDARIO */}
          <div className="lg:col-span-8 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
            <AvailabilityCalendar
              artistId={profileId}
              token={user.token}
              interactiveMode={true}
              onDayClick={handleDayClick}
            />
          </div>

          {/* COLUMNA DERECHA: PANEL DE DETALLE */}
          <div className="lg:col-span-4 space-y-6">

            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 ml-1">
              Operaciones de Fecha
            </h2>

            {!selectedDate && (
              <div className="bg-slate-100/50 border border-slate-200/50 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-4">
                  <CalendarIcon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Ningún día seleccionado</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Haz clic en un día del calendario para ver si tienes reservas o para bloquear tu disponibilidad.
                </p>
              </div>
            )}

            {selectedDate && (
              <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">

                {/* Cabecera del Panel */}
                <div className="p-6 border-b border-slate-100/80 bg-slate-50/50 flex flex-col justify-center items-center text-center space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                    Fecha Seleccionada
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">
                    {new Date(selectedDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </h3>
                </div>

                {/* ESTADO: BLOQUEADO */}
                {isSelectedBlocked && (
                  <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">Día Bloqueado</h4>
                    <p className="text-sm text-slate-500 mb-8 font-medium">
                      Has marcado este día como no disponible. No recibirás propuestas para esta fecha.
                    </p>

                    <button
                      onClick={handleUnblock}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 h-12 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                      Desbloquear Día
                    </button>
                  </div>
                )}

                {/* ESTADO: LIBRE */}
                {isSelectedFree && !loadingBooking && (
                  <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 border border-amber-100">
                      <Unlock className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">Día Libre</h4>
                    <p className="text-sm text-slate-500 mb-8 font-medium">
                      Estás disponible para recibir propuestas para esta fecha.
                    </p>

                    <button
                      onClick={handleBlock}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin text-slate-300" /> : <Lock className="w-4 h-4 opacity-80" />}
                      Bloquear Disponibilidad
                    </button>
                  </div>
                )}

                {/* ESTADO: RESERVADO / BOOKED */}
                {isSelectedBooked && (
                  <div className="p-0">
                    <div className="p-6 bg-slate-900 text-white flex flex-col items-center text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                      <div className="relative z-10 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                        <CalendarIcon className="w-8 h-8 text-amber-400" />
                      </div>
                      <h4 className="font-bold text-xl relative z-10 mb-1">Día Ocupado</h4>
                      <p className="text-sm text-slate-300 font-medium relative z-10">
                        Tienes una actuación este día
                      </p>
                    </div>

                    <div className="p-6 space-y-4">
                      {/* Estado Pill */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</span>
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-emerald-100 text-emerald-700">
                          {bookingDetail.status}
                        </span>
                      </div>

                      {/* Recinto */}
                      {bookingDetail.venue && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MapPin className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {bookingDetail.venue.name}
                            </p>
                            {bookingDetail.venue.city && (
                              <p className="text-xs font-medium text-slate-500 mt-0.5">
                                {bookingDetail.venue.city}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Detalles Económicos */}
                      {(bookingDetail.totalAmount !== undefined && bookingDetail.totalAmount !== null) && (
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Euro className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Monto Total</span>
                          </div>
                          <span className="font-black text-slate-900 tabular-nums">
                            {bookingDetail.totalAmount} {bookingDetail.currency || '€'}
                          </span>
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="pt-4 mt-2 border-t border-slate-100">
                        <button
                          onClick={() => window.location.href = '/artists/bookings'}
                          className="w-full h-10 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          Ver en mis reservas
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <p className="text-[10px] text-center font-medium text-slate-400 mt-2 px-4">
                          No puedes desbloquear fechas con actuaciones confirmadas sin cancelar la reserva.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ESTADO: CARGANDO BOOKING */}
                {loadingBooking && (
                  <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mb-3" />
                    <span className="text-xs font-bold uppercase tracking-widest">Verificando...</span>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default withRole(ArtistCalendarPage, ['ARTIST']);

