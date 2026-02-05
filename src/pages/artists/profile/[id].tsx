import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import {
  AlertCircle,
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Link2,
  MapPin,
  Music,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wallet,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { useArtistAvailability } from '@/hooks/artists/useArtistAvailability';
import { getPublicArtistCalendarBlocks } from '@/services/artists/calendar.service';
import { createRepresentationRequest } from '@/services/representations/representations.service';
import { RepresentationStatusBadge } from '@/components/representations/RepresentationStatusBadge';
import { CommissionInput } from '@/components/representations/CommissionInput';
import { ConfirmActionModal } from '@/components/representations/ConfirmActionModal';

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
  managerId?: string | null;
  managerName?: string | null;
  canRequestRepresentation?: boolean;
  representationStatus?: 'NONE' | 'PENDING' | 'ACTIVE' | 'REJECTED';
  representationRequestId?: string | null;
  representationCommission?: number | null;
};

export default function ArtistProfilePage() {
  const router = useRouter();
  const { id, date, eventId } = router.query as { id: string; date?: string; eventId?: string };
  const { user } = useAuth();
  const { role } = useMe();
  const roleKnown = Boolean(role);
  const isManager = role === 'MANAGER';

  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<Date>(new Date());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [showRepModal, setShowRepModal] = useState(false);
  const [commission, setCommission] = useState<number | ''>('');
  const [requestState, setRequestState] = useState<
    'IDLE' | 'SUBMITTING' | 'PENDING' | 'RESOLVED_ACCEPTED' | 'RESOLVED_REJECTED' | 'ERROR'
  >('IDLE');
  const [requestError, setRequestError] = useState<string | null>(null);

  const { days: availability, loading: availabilityLoading } = useArtistAvailability(id, month, user?.token);

  const loadArtist = () => {
    if (!id || !user?.token) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/${id}`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        setArtist(data);
        if (data?.representationStatus === 'PENDING') setRequestState('PENDING');
        if (data?.representationStatus === 'REJECTED') setRequestState('RESOLVED_REJECTED');
        if (data?.representationStatus === 'ACTIVE' || data?.managerId) setRequestState('RESOLVED_ACCEPTED');
      })
      .catch(() => setArtist(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!id || !user?.token) return;

    const from = new Date(Date.UTC(month.getFullYear(), month.getMonth(), 1)).toISOString().slice(0, 10);
    const to = new Date(Date.UTC(month.getFullYear(), month.getMonth() + 1, 0)).toISOString().slice(0, 10);

    getPublicArtistCalendarBlocks(id, from, to, user.token)
      .then((data) => setBlockedDates(new Set((data ?? []).map((d: any) => d.date))))
      .catch(() => setBlockedDates(new Set()));
  }, [id, month, user?.token]);

  useEffect(() => {
    loadArtist();
  }, [id, user?.token]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 animate-pulse font-medium text-sm">
          <Clock className="h-4 w-4" />
          <span>Sincronizando perfil del artista...</span>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto rounded-xl border border-red-100 bg-red-50 p-6 text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-900">Artista no encontrado</p>
          <Link href="/venues/discover" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 underline underline-offset-4">
            Explorar roster
          </Link>
        </div>
      </div>
    );
  }

  const isFromEvent = Boolean(eventId);
  const monthLabel = month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const handleBooking = (bookingDate?: string) => {
    if (!roleKnown || isManager) {
      return;
    }
    router.push(
      bookingDate
        ? `/bookings/new?artistId=${id}&date=${bookingDate}${eventId ? `&eventId=${eventId}` : ''}`
        : `/bookings/new?artistId=${id}${eventId ? `&eventId=${eventId}` : ''}`,
    );
  };

  const handleMonthChange = (delta: number) => {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const canRequestRepresentation = Boolean(isManager && artist?.canRequestRepresentation);
  const representationStatus: 'NONE' | 'PENDING' | 'ACTIVE' | 'REJECTED' =
    artist?.representationStatus ?? (artist?.managerId ? 'ACTIVE' : 'NONE');

  const handleSendRepresentationRequest = async () => {
    const targetArtistId = artist?.id ?? id;
    if (!targetArtistId || !user?.token) return;
    if (commission === '' || commission === null) {
      setRequestError('La comisión es obligatoria');
      return;
    }

    setRequestState('SUBMITTING');
    setRequestError(null);

    try {
      await createRepresentationRequest({ artistId: targetArtistId, commissionPercentage: Number(commission), token: user.token });
      setShowRepModal(false);
      setRequestState('PENDING');
      loadArtist();
    } catch (err: any) {
      setRequestState('ERROR');
      setRequestError(err?.message ?? 'No se pudo enviar la solicitud');
    }
  };

  return (
    <>
      <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
        <Link
          href={eventId ? `/events/${eventId}/search-artists` : '/venues/discover'}
          className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al roster
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="size-20 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-slate-900/10 shrink-0">
                {artist.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Perfil Verificado · ARTIME</p>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900">{artist.name}</h1>
                </div>

                <div className="flex flex-wrap gap-4 text-[13px] font-bold text-slate-500">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {artist.city}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Music className="h-4 w-4 text-slate-400" />
                    {artist.genres?.join(', ') || 'Género no definido'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
              {(!isManager && roleKnown) && (
                <button
                  onClick={() => handleBooking()}
                  className="h-12 px-6 rounded-xl bg-slate-900 text-white text-[13px] font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                >
                  <Ticket className="h-4 w-4" />
                  Iniciar propuesta operativa
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-50 bg-slate-50/30">
            <KpiCard label="Ubicación Base" value={artist.city} icon={<MapPin className="size-4" />} />
            <KpiCard label="Caché Orientativo" value={formatCurrency(artist.basePrice, artist.currency)} icon={<Wallet className="size-4" />} />
            <KpiCard
              label="Política Comercial"
              value={artist.isNegotiable ? 'Abierto a negociación' : 'Tarifa cerrada'}
              icon={<ShieldCheck className="size-4" />}
              tone={artist.isNegotiable ? 'emerald' : 'slate'}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <Card title="Biografía profesional" subtitle="Trayectoria y visión artística" icon={<Sparkles className="h-4 w-4" />}>
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[15px] text-slate-700 leading-relaxed font-medium">
                  {artist.bio || 'Este artista aún no ha registrado una descripción profesional detallada.'}
                </p>
              </div>
            </Card>

            <Card title="Agenda Operativa" subtitle="Monitor de disponibilidad en tiempo real" icon={<CalendarIcon className="h-4 w-4" />}>
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleMonthChange(-1)}
                      className="size-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest min-w-[140px] text-center">{monthLabel}</span>
                    <button
                      type="button"
                      onClick={() => handleMonthChange(1)}
                      className="size-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
                    <Clock className="h-3.5 w-3.5" />
                    Datos orientativos
                  </div>
                </div>

                {isFromEvent && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                    <Info className="size-4 text-amber-600 mt-0.5" />
                    <p className="text-[12px] text-amber-800 font-bold leading-snug">
                      La fecha del evento está preseleccionada. El calendario se muestra únicamente como referencia de disponibilidad complementaria.
                    </p>
                  </div>
                )}

                {availabilityLoading ? (
                  <div className="grid grid-cols-7 gap-2 animate-pulse">
                    {[...Array(31)].map((_, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-slate-50" />
                    ))}
                  </div>
                ) : availability.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-sm text-slate-400 font-medium italic">No hay registros de disponibilidad para el periodo seleccionado.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-7 gap-3">
                      {availability.map((day) => {
                        const isBlocked = blockedDates.has(day.date);
                        const status = isBlocked ? 'UNAVAILABLE' : day.status;
                        const baseClasses = 'aspect-square flex items-center justify-center rounded-xl text-[13px] font-black transition-all select-none border-2';
                        const statusClasses =
                          status === 'AVAILABLE'
                            ? 'bg-emerald-50 border-transparent text-emerald-700 cursor-pointer hover:border-emerald-500 hover:scale-105 shadow-sm'
                            : status === 'BOOKED'
                              ? 'bg-slate-100 border-transparent text-slate-300 cursor-not-allowed line-through'
                              : 'bg-slate-50 border-transparent text-slate-200 cursor-not-allowed';

                        return (
                          <div
                            key={day.date}
                            className={`${baseClasses} ${statusClasses}`}
                            onClick={() => {
                              if (status !== 'AVAILABLE') return;
                              if (isFromEvent) return;
                              handleBooking(day.date);
                            }}
                          >
                            {day.date.slice(8, 10)}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50">
                      <LegendItem color="bg-emerald-500" label="Disponible" />
                      <LegendItem color="bg-slate-200" label="Reservado" />
                      <LegendItem color="bg-slate-50" label="No disponible" />
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 rounded-2xl p-5 text-white flex items-start gap-4 shadow-xl shadow-slate-900/10">
                   <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <AlertCircle className="size-5 text-white/60" />
                   </div>
                   <p className="text-[12px] font-medium leading-relaxed opacity-80">
                     Recuerda que la disponibilidad en calendario es informativa. La reserva en firme solo se hace efectiva tras el depósito del booking a través del sistema oficial de pagos de ARTIME.
                   </p>
                </div>
              </div>
            </Card>

            <Card title="Aviso legal" icon={<ShieldCheck className="h-4 w-4" />}>
              <p className="text-[12px] text-slate-500 font-medium italic">
                Toda la información mostrada es propiedad intelectual del artista y se rige por los términos de servicio de la plataforma ARTIME.
              </p>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <Card title="Recursos y Enlaces" subtitle="Material operativo" icon={<Link2 className="h-4 w-4" />}>
              <div className="space-y-3">
                <p className="text-[13px] text-slate-600 font-medium mb-4">Inicia una propuesta para acceder a links privados, tech-riders y contenido exclusivo del EPK.</p>
                <div className="grid grid-cols-1 gap-2">
                   <div className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 grayscale opacity-60 cursor-not-allowed">
                      <FileText className="size-4" />
                      <span className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Technical Rider</span>
                   </div>
                   <div className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 grayscale opacity-60 cursor-not-allowed">
                      <Link2 className="size-4" />
                      <span className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Electronic Press Kit</span>
                   </div>
                </div>
              </div>
            </Card>

            <Card title="Representación" subtitle="Estado de gestión" icon={<User className="h-4 w-4" />}>
              <div className="space-y-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <RepresentationStatusBadge status={representationStatus} />
                    {artist.managerName && representationStatus === 'ACTIVE' && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manager asignado</span>
                        <Link
                          href={artist.managerId ? `/manager/profile/${artist.managerId}` : '/manager/profile'}
                          className="text-[13px] font-black text-slate-900 hover:underline underline-offset-2"
                        >
                          {artist.managerName}
                        </Link>
                      </div>
                    )}
                  </div>

                  {representationStatus === 'PENDING' && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 flex items-start gap-3">
                       <Clock className="size-4 text-amber-600 shrink-0 mt-0.5" />
                       <p className="text-[12px] text-amber-900 font-bold leading-snug">
                         Solicitud en curso. El artista debe validar la propuesta antes de proceder.
                       </p>
                    </div>
                  )}

                  {representationStatus === 'NONE' && !artist.managerId && (
                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                      El artista gestiona sus contrataciones de forma directa. No hay representación activa en el sistema.
                    </p>
                  )}

                  {representationStatus === 'REJECTED' && (
                    <p className="text-[12px] text-red-600 font-bold italic">La solicitud previa fue desestimada.</p>
                  )}

                  {canRequestRepresentation ? (
                    <button
                      type="button"
                      className="w-full h-12 inline-flex items-center justify-center rounded-xl bg-slate-900 text-white text-[13px] font-black shadow-lg shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-50 transition-all"
                      onClick={() => setShowRepModal(true)}
                      disabled={requestState === 'PENDING' || representationStatus === 'PENDING'}
                    >
                      {requestState === 'PENDING' || representationStatus === 'PENDING' ? 'Gestión pendiente' : 'Solicitar representación'}
                    </button>
                  ) : (
                    <div className="pt-2">
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">Operación restringida por el sistema</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <RepresentationRequestModal
        open={showRepModal}
        onClose={() => {
          setShowRepModal(false);
          setRequestError(null);
        }}
        artistName={artist.name}
        commission={commission}
        setCommission={setCommission}
        onConfirm={handleSendRepresentationRequest}
        loading={requestState === 'SUBMITTING'}
        error={requestError}
      />
    </>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`size-3 rounded-md ${color} border border-black/5`} />
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}

function RepresentationRequestModal({
  open,
  onClose,
  artistName,
  commission,
  setCommission,
  onConfirm,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  artistName: string;
  commission: number | '';
  setCommission: (value: number | '') => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <ConfirmActionModal
      open={open}
      onClose={onClose}
      title={`Solicitar representación a ${artistName}`}
      description="Estás solicitando representar profesionalmente a este artista en ARTIME. El flujo se activará tras la validación oficial."
      confirmLabel="Ejecutar solicitud"
      footer={
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Comisión pactada (%)</label>
             <CommissionInput
                value={commission}
                onChange={(e) => setCommission(e.target.value === '' ? '' : Number(e.target.value))}
                error={error}
              />
          </div>
          <p className="text-[11px] text-slate-400 font-medium italic">
            * Hasta la aceptación oficial, el sistema mantendrá las restricciones de gestión sobre el roster.
          </p>
        </div>
      }
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

function KpiCard({ label, value, icon, tone = 'slate' }: { label: string; value: string | number; icon?: ReactNode; tone?: 'slate' | 'amber' | 'emerald' }) {
  const accentClass = tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <div className="px-8 py-6 relative group overflow-hidden">
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full ${accentClass}`} />
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          {icon}
          {label}
        </p>
        <p className="text-xl font-black text-slate-900 tracking-tight tabular-nums truncate">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <header className="px-6 py-6 border-b border-slate-50 bg-white flex items-center gap-4">
        <div className="size-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none truncate">{title}</h2>
          {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none truncate">{subtitle}</p>}
        </div>
      </header>
      <div className="p-6 flex-1">
        {children}
      </div>
    </section>
  );
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}
