import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { ShieldCheck, EyeOff, FileText, Image as ImageIcon, Video, CalendarIcon, Loader2, Sparkles, Handshake } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { getPromoterGallery } from '@/services/promoters/gallery.service';
import { getPromoterVideos } from '@/services/promoters/videos.service';
import { ProfileHero } from '@/components/profile/ProfileHero';

type PromoterProfile = {
  id: string;
  name: string;
  city?: string | null;
  country?: string | null;
  description?: string | null;
  eventTypes?: string[];
  isPublic?: boolean | null;
  profileImageUrl?: string | null;
  isVerified?: boolean;
};

export default function PromoterPublicProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PromoterProfile | null>(null);
  const [gallery, setGallery] = useState<Array<{ id: string; url: string }>>([]);
  const [videos, setVideos] = useState<Array<{ id: string; youtubeId: string; title?: string | null }>>([]);
  const [mediaTab, setMediaTab] = useState<'gallery' | 'videos'>('gallery');

  // Carga del perfil principal
  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    setLoading(true);
    setError(null);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/promoters/${id}`, {
      headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined,
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'No se pudo cargar el perfil');
        }
        return res.json();
      })
      .then((profileData) => {
        setProfile({
          id: profileData.id,
          name: profileData.name ?? 'Promotor',
          city: profileData.city ?? '',
          country: profileData.country ?? '',
          description: profileData.description ?? '',
          eventTypes: profileData.eventTypes ?? [],
          isPublic: profileData.isPublic ?? true,
          profileImageUrl: profileData.profileImageUrl ?? null,
          isVerified: Boolean(profileData.isVerified),
        });
      })
      .catch((err: any) => {
        setError(err?.message || 'No se pudo cargar el perfil');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, user?.token]);

  // Carga de multimedia
  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    getPromoterGallery(id)
      .then((items) => setGallery(items ?? []))
      .catch(() => setGallery([]));
  }, [id]);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    getPromoterVideos(id)
      .then((items) => setVideos(items ?? []))
      .catch(() => setVideos([]));
  }, [id]);

  // Pantallas de Carga y Error
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center -mt-[73px]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
          <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-400/20 blur-xl animate-pulse" />
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin relative z-10" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Montando escenario…
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 -mt-[73px]">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border-t-4 border-rose-500 shadow-xl shadow-rose-900/5">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🚧</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Algo salió mal</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // Pantalla de Perfil Oculto
  if (profile.isPublic === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 -mt-[73px]">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <EyeOff className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Perfil en Off</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Este organizador ha decidido mantener su ficha profesional en privado por el momento.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex justify-center items-center rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-slate-800 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'P')}&background=1e293b&color=fff&size=256`;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* ── HERO PREMIUM COMPARTIDO ─────────────────────────────── */}
      <ProfileHero
        name={profile.name}
        typeLabel="Productores y Festivales"
        location={[profile.city, profile.country].filter(Boolean).join(', ')}
        genres={profile.eventTypes ?? []}
        avatarUrl={profile.profileImageUrl || fallbackAvatar}
        isVerified={Boolean(profile.isVerified)}
      />

      {/* ── CUERPO (MAIN) ──────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 -mt-8 space-y-6">

        {/* Descripción / Biografía */}
        <GlassCard
          icon={<FileText className="w-4 h-4 text-amber-500" />}
          title="Acerca del Promotor"
        >
          {profile.description ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {profile.description}
            </p>
          ) : (
            <div className="flex items-center gap-3 text-sm text-slate-400 italic">
              <span className="w-2 h-2 rounded-full bg-slate-200" />
              La biografía de este productor aún está tomando forma.
            </div>
          )}
        </GlassCard>

        {/* Multimedia Tabs & Content */}
        <GlassCard className="p-0 overflow-hidden">
          {/* Header Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto custom-scrollbar">
            <TabButton
              active={mediaTab === 'gallery'}
              onClick={() => setMediaTab('gallery')}
              icon={<ImageIcon className="w-3.5 h-3.5" />}
              label={`Galería Eventos (${gallery.length})`}
            />
            <TabButton
              active={mediaTab === 'videos'}
              onClick={() => setMediaTab('videos')}
              icon={<Video className="w-3.5 h-3.5" />}
              label={`Videos Promocionales (${videos.length})`}
            />
          </div>

          {/* Tab Panes */}
          <div className="p-6 md:p-8">
            {mediaTab === 'gallery' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.length > 0 ? (
                  gallery.map((item) => (
                    <div key={item.id} className="relative group overflow-hidden rounded-2xl bg-slate-100 aspect-square border border-slate-200/50">
                      <img
                        src={item.url}
                        alt="Galería del evento"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                    <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin imágenes disponibles</p>
                  </div>
                )}
              </div>
            )}

            {mediaTab === 'videos' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.length > 0 ? (
                  videos.map((item) => (
                    <div key={item.id} className="relative group overflow-hidden rounded-2xl bg-black aspect-video border border-slate-200">
                      <img
                        src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
                        alt="Video"
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl group-hover:bg-amber-500/90 group-hover:border-amber-400 group-hover:scale-110 transition-all duration-300">
                          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                        </div>
                      </div>
                      <a
                        href={`https://www.youtube.com/watch?v=${item.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 z-10"
                        aria-label="Ver video en YouTube"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                    <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin videos disponibles</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Action / Contact Card - OPCIONAL para el perfil de promotor publico */}
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 border-none relative overflow-hidden text-center md:text-left shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-10 pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Handshake className="w-5 h-5 text-amber-400" />
                ¿Listo para colaborar?
              </h3>
              <p className="text-slate-300 text-sm">Gestiona tus bookings y agenda con {profile.name} a través de ARTIME.</p>
            </div>
            <button className="whitespace-nowrap rounded-xl bg-amber-500 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-slate-900 hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              Contactar / Booking
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}

// ── Components Compartidos ──────────────────────────────────────────

function GlassCard({
  icon,
  title,
  children,
  className = ''
}: {
  icon?: ReactNode;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className || 'p-6 sm:p-8'}`}>
      {(title || icon) && (
        <header className="flex items-center gap-2 mb-6">
          {icon}
          {title && <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">{title}</h2>}
        </header>
      )}
      {children}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 m-1 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${active
        ? 'bg-slate-900 text-white shadow-md'
        : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      {icon} {label}
    </button>
  );
}
