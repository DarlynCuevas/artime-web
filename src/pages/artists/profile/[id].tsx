import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { AlertCircle, ArrowLeft, Calendar as CalendarIcon, Clock, Link2, MapPin, Music, ShieldCheck, Sparkles, Ticket, Wallet } from 'lucide-react';

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
    return <div className="p-8 text-slate-700">Cargando artista…</div>;
  }

  if (!artist) {
    return <div className="p-8 text-red-600">Artista no encontrado</div>;
  }

  const isFromEvent = Boolean(eventId);
  const eventDate = date;
  const monthLabel = month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const handleBooking = (bookingDate?: string) => {
    if (!roleKnown || isManager) {
      setShowRepModal(true);
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
      <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <Link
        href={eventId ? `/events/${eventId}/search-artists` : '/venues/discover'}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a artistas
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 text-lg font-semibold">
            {artist.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-semibold text-slate-900 tracking-tight">{artist.name}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5" /> Perfil verificado en ARTIME
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {artist.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Wallet className="h-4 w-4" />
                {formatCurrency(artist.basePrice, artist.currency)} base
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                {artist.isNegotiable ? 'Negociable' : 'No negociable'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {artist.genres?.length === 0 && <span className="text-xs text-slate-500">Añade géneros</span>}
              {artist.genres?.map((genre) => (
                <span
                  key={genre}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                >
                  <Music className="h-3 w-3" />
                  {genre}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2 text-sm text-slate-600">
            {(!isManager && roleKnown) && (
              <div className="inline-flex items-center gap-1 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-medium">
                <Ticket className="h-4 w-4" /> Iniciar booking
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Biografía" icon={<Sparkles className="h-4 w-4 text-slate-600" />}>
            <p className="text-slate-700 leading-relaxed">
              {artist.bio || 'No hay descripción profesional registrada.'}
            </p>
          </Card>

          <Card title="Disponibilidad" icon={<CalendarIcon className="h-4 w-4 text-slate-600" />}>
            <div className="flex items-center justify-between mb-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMonthChange(-1)}
                  className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                >
                  -
                </button>
                <span className="font-medium text-slate-900 capitalize">{monthLabel}</span>
                <button
                  type="button"
                  onClick={() => handleMonthChange(1)}
                  className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                >
                  +
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-4 w-4" /> Orientativo, confirmar vía booking
              </div>
            </div>

            {isFromEvent && (
              <p className="text-xs text-slate-500 mb-3">
                Fecha del evento fija. El calendario es solo informativo.
              </p>
            )}

            {availabilityLoading && <p className="text-sm text-slate-500">Cargando disponibilidad…</p>}

            {!availabilityLoading && availability.length === 0 && (
              <p className="text-sm text-slate-500">No hay información de disponibilidad para este mes.</p>
            )}

            {!availabilityLoading && availability.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-2">
                  {availability.map((day) => {
                    const isBlocked = blockedDates.has(day.date);
                    const status = isBlocked ? 'UNAVAILABLE' : day.status;
                    const baseClasses = 'rounded-lg px-2 py-3 text-center text-sm transition select-none';
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
                          if (isFromEvent) return;
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
          </Card>

          <Card title="Notas" icon={<AlertCircle className="h-4 w-4 text-slate-600" />}>
            <p className="text-sm text-slate-600">
              La información de este perfil es descriptiva y no constituye un acuerdo contractual.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Material" icon={<Link2 className="h-4 w-4 text-slate-600" />}>
            <p className="text-sm text-slate-600">Comparte links clave (EPK, tech rider, redes) al iniciar la propuesta.</p>
          </Card>

          <Card title="Representación" icon={<ShieldCheck className="h-4 w-4 text-slate-600" />}>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-3">
                <RepresentationStatusBadge status={representationStatus} />
                {artist.managerName && representationStatus === 'ACTIVE' && (
                  <span className="text-sm text-slate-700">
                    Manager:{' '}
                    <Link
                      href={artist.managerId ? `/manager/profile/${artist.managerId}` : '/manager/profile'}
                      className="font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-2"
                    >
                      {artist.managerName}
                    </Link>
                  </span>
                )}
              </div>

              {representationStatus === 'PENDING' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                  Solicitud pendiente de respuesta por el artista. No se pueden enviar nuevas solicitudes hasta que responda.
                </div>
              )}

              {representationStatus === 'NONE' && !artist.managerId && (
                <p className="text-sm text-slate-600">
                  La representación solo se activará si el artista acepta. Hasta entonces no podrás actuar en su nombre.
                </p>
              )}

              {representationStatus === 'REJECTED' && (
                <p className="text-sm text-slate-600">La última solicitud fue rechazada. Espera a que el backend permita un nuevo intento.</p>
              )}

              {canRequestRepresentation ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={() => setShowRepModal(true)}
                  disabled={requestState === 'PENDING' || representationStatus === 'PENDING'}
                >
                  {requestState === 'PENDING' || representationStatus === 'PENDING' ? 'Solicitud pendiente' : 'Solicitar representación'}
                </button>
              ) : (
                <p className="text-xs text-slate-500">El backend indica que no puedes solicitar representación en este momento.</p>
              )}
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
      description="Estás solicitando representar profesionalmente a este artista en ARTIME. La representación solo se activará si el artista acepta."
      confirmLabel="Enviar solicitud"
      footer={
        <div className="space-y-2 text-slate-700">
          <CommissionInput
            value={commission}
            onChange={(e) => setCommission(e.target.value === '' ? '' : Number(e.target.value))}
            error={error}
          />
          <p className="text-xs text-slate-500">Hasta que el artista acepte no podrás actuar en su nombre.</p>
        </div>
      }
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

function KpiCard({ icon, label, value, tone = 'slate' }: { icon: ReactNode; label: string; value: string | number; tone?: 'slate' | 'amber' | 'emerald' }) {
  const toneClass = {
    slate: 'bg-slate-900 text-white',
    amber: 'bg-amber-600 text-white',
    emerald: 'bg-emerald-600 text-white',
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`px-4 py-4 ${toneClass}`}>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
      <header className="flex items-center gap-2">
        {icon && <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div>}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}
