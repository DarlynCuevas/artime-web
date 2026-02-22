import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Music,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { createRepresentationRequest } from '@/services/representations/representations.service';
import { RepresentationStatusBadge } from '@/components/representations/RepresentationStatusBadge';
import { CommissionInput } from '@/components/representations/CommissionInput';
import { ConfirmActionModal } from '@/components/representations/ConfirmActionModal';
import { getArtistGallery } from '@/services/artists/gallery.service';
import { getArtistVideos } from '@/services/artists/videos.service';

import { ProfileHero } from '@/components/profile/ProfileHero';
import { PricingCard } from '@/components/profile/PricingCard';
import { GlassCard } from '@/components/profile/GlassCard';
import { ManagerSidebarCard } from '@/components/profile/ManagerSidebarCard';
import { AvailabilityCalendar } from '@/components/profile/AvailabilityCalendar';

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
  profileImageUrl?: string | null;
};

export default function ArtistProfilePage() {
  const router = useRouter();
  const { id, date, eventId } = router.query as { id: string; date?: string; eventId?: string };
  const { user } = useAuth();
  const { role } = useMe();
  const roleKnown = Boolean(role);
  const isManager = role === 'MANAGER';

  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRepModal, setShowRepModal] = useState(false);
  const [commission, setCommission] = useState<number | ''>('');
  const [requestState, setRequestState] = useState<
    'IDLE' | 'SUBMITTING' | 'PENDING' | 'RESOLVED_ACCEPTED' | 'RESOLVED_REJECTED' | 'ERROR'
  >('IDLE');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<Array<{ id: string; url: string }>>([]);
  const [showGalleryImage, setShowGalleryImage] = useState<string | null>(null);
  const [videos, setVideos] = useState<Array<{ id: string; youtubeId: string; title?: string | null }>>([]);
  const [showVideoId, setShowVideoId] = useState<string | null>(null);
  const [mediaTab, setMediaTab] = useState<'gallery' | 'videos' | 'material'>('gallery');


  const loadArtist = () => {
    if (!id || !user?.token) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/${id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setArtist(data);
        setProfileImageUrl(data?.profileImageUrl ?? null);
        if (data?.representationStatus === 'PENDING') setRequestState('PENDING');
        if (data?.representationStatus === 'REJECTED') setRequestState('RESOLVED_REJECTED');
        if (data?.representationStatus === 'ACTIVE' || data?.managerId) setRequestState('RESOLVED_ACCEPTED');
      })
      .catch(() => setArtist(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadArtist(); }, [id, user?.token]);

  useEffect(() => {
    if (!id) return;
    getArtistGallery(id).then((items) => setGallery(items ?? [])).catch(() => setGallery([]));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getArtistVideos(id).then((items) => setVideos(items ?? [])).catch(() => setVideos([]));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Skeleton Hero */}
        <div className="w-full h-[340px] bg-slate-200 animate-pulse" />
        <div className="max-w-5xl mx-auto px-6 mt-6 space-y-4">
          <div className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Artista no encontrado</p>
        </div>
      </div>
    );
  }

  const isFromEvent = Boolean(eventId);

  const handleBooking = (bookingDate?: string) => {
    if (!roleKnown || isManager) return;
    router.push(
      bookingDate
        ? `/bookings/new?artistId=${id}&date=${bookingDate}${eventId ? `&eventId=${eventId}` : ''}`
        : `/bookings/new?artistId=${id}${eventId ? `&eventId=${eventId}` : ''}`,
    );
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

  const pricingCard = (
    <PricingCard
      amount={artist.basePrice}
      currency={artist.currency}
      isNegotiable={artist.isNegotiable}
      buttonText={isManager ? 'Ver calendario' : 'Iniciar booking'}
      onActionClick={() => handleBooking()}
    />
  );

  return (
    <>
      <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">

        {/* Back link */}
        <div className="max-w-5xl mx-auto px-6 pt-4">
          <Link
            href={eventId ? `/events/${eventId}/search-artists` : '/venues/discover'}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a artistas
          </Link>
        </div>

        {/* Hero */}
        <ProfileHero
          name={artist.name}
          typeLabel={artist.format ?? 'Artista'}
          location={artist.city}
          genres={artist.genres ?? []}
          managerName={artist.managerName ?? undefined}
          avatarUrl={profileImageUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=1e293b&color=fff&size=256`}
          actionElement={pricingCard}
        />

        {/* PricingCard móvil */}
        <div className="block lg:hidden max-w-5xl mx-auto px-4 pt-4">
          {pricingCard}
        </div>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 lg:-mt-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">

              {/* Bio */}
              <GlassCard title="Sobre el artista" icon={<Sparkles className="w-4 h-4" />}>
                <p className="text-slate-600 leading-relaxed">
                  {artist.bio || 'No hay descripción profesional registrada.'}
                </p>
                {artist.format && (
                  <div className="mt-3 text-xs text-slate-500">
                    Formato: <span className="text-slate-700 font-medium">{artist.format}</span>
                  </div>
                )}
              </GlassCard>

              {/* Disponibilidad */}
              <GlassCard
                title="Disponibilidad"
                icon={<Sparkles className="w-4 h-4" />}
                rightAction={
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" /> Orientativo
                  </div>
                }
              >
                {isFromEvent && (
                  <p className="text-xs text-slate-500 mb-3">
                    Fecha del evento fija. El calendario es solo informativo.
                  </p>
                )}
                <AvailabilityCalendar
                  artistId={id}
                  token={user?.token}
                  onDayClick={(date) => handleBooking(date)}
                  readOnly={isFromEvent || isManager}
                />
              </GlassCard>

              {/* Portfolio Multimedia */}
              <GlassCard
                title="Portfolio Multimedia"
                rightAction={
                  <div className="flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/50">
                    {(['gallery', 'videos', 'material'] as const).map((tab) => {
                      const labels = { gallery: 'Fotos', videos: 'Vídeos', material: 'Material' };
                      return (
                        <button
                          key={tab}
                          onClick={() => setMediaTab(tab)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${mediaTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>
                }
              >
                {mediaTab === 'gallery' && (
                  gallery.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">Este artista aún no ha subido imágenes.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {gallery.map((item, idx) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setShowGalleryImage(item.url)}
                          className={`group relative overflow-hidden rounded-xl bg-slate-100 cursor-pointer ${idx === 0 ? 'sm:col-span-2 sm:row-span-2 h-64 sm:h-auto' : 'h-36'}`}
                        >
                          <img src={item.url} alt="Galería" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500" />
                          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl pointer-events-none" />
                        </button>
                      ))}
                    </div>
                  )
                )}

                {mediaTab === 'videos' && (
                  videos.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">Este artista aún no ha subido videos.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {videos.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setShowVideoId(item.youtubeId)}
                          className="group relative overflow-hidden rounded-xl bg-slate-100 h-36 cursor-pointer"
                        >
                          <img src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`} alt={item.title ?? 'Video'} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white group-hover:bg-brand-amber group-hover:border-amber-400 group-hover:text-amber-950 transition-all duration-300">
                              <Play className="w-4 h-4 ml-0.5" />
                            </div>
                          </div>
                          {item.title && (
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-slate-900/80 to-transparent">
                              <p className="text-white text-xs font-bold truncate">{item.title}</p>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )
                )}

                {mediaTab === 'material' && (
                  <div>
                    <p className="text-sm text-slate-600">
                      El material operativo (EPK, tech rider, redes y enlaces clave) se comparte al iniciar la propuesta en ARTIME.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['EPK', 'Tech rider', 'Redes'].map((label) => (
                        <span key={label} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{label}</span>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>

              {/* ManagerSidebarCard en móvil */}
              {artist.managerId && (
                <div className="block lg:hidden">
                  <ManagerSidebarCard
                    name={artist.managerName ?? 'Representante'}
                    agency="Mánager verificado"
                    avatarUrl={`https://ui-avatars.com/api/?name=${encodeURIComponent(artist.managerName ?? 'M')}&background=f59e0b&color=fff&size=128`}
                    bio="Gestiona la agenda y contrataciones del artista en ARTIME."
                    onViewProfile={() => router.push(artist.managerId ? `/manager/profile/${artist.managerId}` : '/manager/profile')}
                  />
                </div>
              )}
            </div>

            {/* Sidebar — solo desktop */}
            <aside className="hidden lg:block space-y-6">

              {/* ManagerSidebarCard */}
              {artist.managerId && (
                <ManagerSidebarCard
                  name={artist.managerName ?? 'Representante'}
                  agency="Mánager verificado"
                  avatarUrl={`https://ui-avatars.com/api/?name=${encodeURIComponent(artist.managerName ?? 'M')}&background=f59e0b&color=fff&size=128`}
                  bio="Gestiona la agenda y contrataciones del artista en ARTIME."
                  onViewProfile={() => router.push(artist.managerId ? `/manager/profile/${artist.managerId}` : '/manager/profile')}
                />
              )}

              {/* Representación */}
              <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Representación</h3>
                </div>
                <div className="p-6 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <RepresentationStatusBadge status={representationStatus} />
                    {artist.managerName && representationStatus === 'ACTIVE' && (
                      <span className="text-sm text-slate-700">
                        <Link
                          href={artist.managerId ? `/manager/profile/${artist.managerId}` : '/manager/profile'}
                          className="font-semibold text-slate-900 hover:text-brand-amber underline underline-offset-2 transition-colors"
                        >
                          {artist.managerName}
                        </Link>
                      </span>
                    )}
                  </div>

                  {representationStatus === 'PENDING' && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-xs">
                      Solicitud pendiente de respuesta por el artista.
                    </div>
                  )}

                  {representationStatus === 'NONE' && !artist.managerId && (
                    <p className="text-xs text-slate-500">La representación solo se activará si el artista acepta.</p>
                  )}

                  {representationStatus === 'REJECTED' && (
                    <p className="text-xs text-slate-500">La última solicitud fue rechazada.</p>
                  )}

                  {canRequestRepresentation && (
                    <button
                      type="button"
                      className="w-full h-10 rounded-xl bg-brand-amber hover:bg-amber-400 text-amber-950 font-bold text-sm shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setShowRepModal(true)}
                      disabled={requestState === 'PENDING' || representationStatus === 'PENDING'}
                    >
                      {requestState === 'PENDING' || representationStatus === 'PENDING' ? 'Solicitud pendiente' : 'Solicitar representación'}
                    </button>
                  )}

                  {!canRequestRepresentation && isManager && (
                    <p className="text-xs text-slate-400">No puedes solicitar representación en este momento.</p>
                  )}
                </div>
              </div>

              {/* Condiciones */}
              <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Music className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Condiciones</h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${artist.isNegotiable ? 'bg-amber-400 ring-4 ring-amber-100' : 'bg-slate-300 ring-4 ring-slate-100'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{artist.isNegotiable ? 'Precio negociable' : 'Caché fijo'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Las contraofertas se evaluarán según el aforo y el tipo de evento.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Pagos seguros vía ARTIME</p>
                      <p className="text-xs text-slate-500 mt-0.5">El pago se retiene de forma segura hasta la finalización del evento.</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </main>
      </div>

      {/* Modals — sin cambios */}
      <RepresentationRequestModal
        open={showRepModal}
        onClose={() => { setShowRepModal(false); setRequestError(null); }}
        artistName={artist.name}
        commission={commission}
        setCommission={setCommission}
        onConfirm={handleSendRepresentationRequest}
        loading={requestState === 'SUBMITTING'}
        error={requestError}
      />

      {showImageModal && profileImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setShowImageModal(false)}>
          <div className="relative w-[320px] sm:w-[420px] md:w-[520px]">
            <div className="rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <img src={profileImageUrl} alt={`Foto de ${artist.name}`} className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {showGalleryImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setShowGalleryImage(null)}>
          <div className="relative w-[320px] sm:w-[420px] md:w-[520px]">
            <div className="rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <img src={showGalleryImage} alt="Imagen de galería" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {showVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setShowVideoId(null)}>
          <div className="relative w-[320px] sm:w-[520px] md:w-[640px]">
            <div className="rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-full aspect-video">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${showVideoId}?modestbranding=1&controls=1&rel=0`}
                  title="Video del artista"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RepresentationRequestModal({
  open, onClose, artistName, commission, setCommission, onConfirm, loading, error,
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
