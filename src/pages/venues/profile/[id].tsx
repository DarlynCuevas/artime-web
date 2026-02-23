import { useRouter } from 'next/router';
import { useEffect, useState, type ReactNode } from 'react';
import { MapPin, Users, Headphones, Info, Image as ImageIcon, Loader2, Link2, Mail, Phone, Library, Handshake, Calendar, Sparkles } from 'lucide-react';

import { getVenueById } from '@/services/venues/venues.service';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { CapacityCard } from '@/components/profile/CapacityCard';
import { AvailabilityCalendar } from '@/components/profile/AvailabilityCalendar';
import { GlassCard } from '@/components/profile/GlassCard';

type VenueProfile = {
  id: string;
  name: string;
  city: string;
  description: string;
  capacity?: number;
  address?: string;
  genres?: string[];
  images?: string[];
  amenities?: string[] | string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  profileImageUrl?: string;
  isVerified?: boolean;
};

export default function VenuePublicProfilePage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const artistName = (router.query?.artistName as string) || null;
  const { user } = useAuth();
  const { role } = useMe();

  const [venue, setVenue] = useState<VenueProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaTab, setMediaTab] = useState<'gallery' | 'videos'>('gallery');
  const [showGalleryImage, setShowGalleryImage] = useState<string | null>(null);
  const [showVideoId, setShowVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !id) return;

    getVenueById(id, user?.token)
      .then((data) => {
        // Normalización si los endpoints difieren un poco internamente
        setVenue(data);
      })
      .catch(() => {
        setVenue(null);
      })
      .finally(() => setLoading(false));
  }, [router.isReady, id, user?.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center -mt-[73px]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
          <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-400/20 blur-xl animate-pulse" />
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin relative z-10" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Abriendo puertas de la sala…
          </span>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 -mt-[73px]">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border-t-4 border-rose-500">
          <p className="text-slate-900 font-bold mb-2">Sala no encontrada</p>
          <p className="text-slate-500 text-sm">El espacio al que intentas acceder no existe o está oculto.</p>
          <button
            onClick={() => router.back()}
            className="mt-6 inline-flex justify-center items-center rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-slate-800 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(venue.name || 'S')}&background=1e293b&color=fff&size=256`;
  const locationString = [venue.address, venue.city].filter(Boolean).join(' · ');

  const isManager = role === 'MANAGER';

  const capacityCard = (
    <CapacityCard
      capacity={venue.capacity}
      disabled={!isManager}
      disabledMessage={!isManager ? "Solo managers pueden enviar propuestas" : undefined}
    />
  );

  return (
    <>
      <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">
        {/* ── HERO PREMIUM COMPARTIDO ─────────────────────────────── */}
        <ProfileHero
          name={venue.name}
          typeLabel="Sala de Conciertos"
          location={locationString || 'Ubicación no especificada'}
          genres={venue.genres ?? []}
          avatarUrl={venue.profileImageUrl || fallbackAvatar}
          isVerified={Boolean(venue.isVerified)}
          actionElement={capacityCard}
        />

        {/* CapacityCard móvil */}
        <div className="block lg:hidden max-w-5xl mx-auto px-4 pt-4 relative z-20">
          {capacityCard}
        </div>

        {/* ── CUERPO (MAIN) ──────────────────────────────────────────────── */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 lg:-mt-8 relative z-10">

          {/* Notificación de contexto de artista si vinimos desde una propuesta */}
          {artistName && (
            <div className="mb-6 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-4 flex items-center gap-3 shadow-sm animate-in slide-in-from-top duration-700">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-emerald-600 font-bold text-sm">ℹ️</span>
              </div>
              <div>
                <p className="text-sm text-emerald-800 font-medium">Buscando sala para <span className="font-bold">{artistName}</span></p>
                <p className="text-xs text-emerald-600 mt-0.5">Revisa el aforo y el rider para asegurarte de que encaje con la propuesta del artista.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

            {/* COLUMNA PRINCIPAL */}
            <div className="lg:col-span-2 space-y-6">

              <GlassCard
                icon={<Info className="w-4 h-4 text-amber-500" />}
                title="Acerca de la sala"
              >
                {venue.description ? (
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                    {venue.description}
                  </p>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-slate-400 italic">
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    Sala sin biografía publicada.
                  </div>
                )}
                {venue.amenities && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Equipamiento (Rider Base)</h4>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {Array.isArray(venue.amenities) ? venue.amenities.join(', ') : venue.amenities}
                    </p>
                  </div>
                )}
              </GlassCard>

              <GlassCard
                title="Disponibilidad"
                icon={<Calendar className="w-4 h-4 text-amber-500" />}
                rightAction={
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Info className="h-3 w-3" /> Orientativo
                  </div>
                }
              >
                <AvailabilityCalendar
                  venueId={venue.id}
                  readOnly={true}
                />
              </GlassCard>

              <GlassCard
                title="Portfolio Multimedia"
                icon={<ImageIcon className="w-4 h-4 text-amber-500" />}
                rightAction={
                  <div className="flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/50">
                    {(['gallery', 'videos'] as const).map((tab) => {
                      const labels = { gallery: 'Fotos', videos: 'Vídeos' };
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
                className="p-0 overflow-hidden"
              >
                <div className="p-6 sm:p-8 pt-0 mt-6">
                  {mediaTab === 'gallery' && (
                    venue.images && venue.images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {venue.images.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setShowGalleryImage(img)}
                            className={`group relative overflow-hidden rounded-xl bg-slate-100 cursor-pointer aspect-square ${idx === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}
                          >
                            <img src={img} alt="Galería" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl pointer-events-none" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-6">Esta sala aún no ha subido imágenes.</p>
                    )
                  )}

                  {mediaTab === 'videos' && (
                    <p className="text-sm text-slate-500 text-center py-6">Esta sala aún no ha subido vídeos.</p>
                  )}
                </div>
              </GlassCard>

            </div>

            {/* SIDEBAR DERECHA */}
            <aside className="hidden lg:block space-y-6">

              {(venue.website || venue.contactEmail || venue.contactPhone) && (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <MapPin className="h-3.5 w-3.5 text-slate-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Contacto Directo</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4 text-sm text-slate-700">
                      {venue.website && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Website</span>
                          <a href={venue.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 hover:text-brand-amber underline underline-offset-2 transition-colors truncate">
                            {venue.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                      {venue.contactEmail && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                          <a href={`mailto:${venue.contactEmail}`} className="font-semibold text-slate-900 hover:text-brand-amber transition-colors truncate">
                            {venue.contactEmail}
                          </a>
                        </div>
                      )}
                      {venue.contactPhone && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</span>
                          <a href={`tel:${venue.contactPhone}`} className="font-semibold text-slate-900 hover:text-brand-amber transition-colors">
                            {venue.contactPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </aside>
          </div>

        </main>

        {/* Modals de Galeria */}
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
                    title="Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Components Compartidos ──────────────────────────────────────────
