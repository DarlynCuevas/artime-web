import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Camera, CheckCircle2, Eye, Globe2, Loader2, MapPin, ShieldCheck, Sparkles, Image as ImageIcon, Video, Trash2, Calendar } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { withRole } from '@/components/auth/withRole';
import { getProfileImage, uploadProfileImage } from '@/services/users/profileImage.service';
import { deletePromoterGalleryImage, getPromoterGallery, uploadPromoterGalleryImage } from '@/services/promoters/gallery.service';
import { addPromoterVideo, deletePromoterVideo, getPromoterVideos } from '@/services/promoters/videos.service';
import { VerificationBanner } from '@/components/profile/VerificationBanner';

type PromoterProfile = {
  id: string;
  name: string;
  city?: string | null;
  country?: string | null;
  description?: string | null;
  eventTypes?: string[];
  isPublic?: boolean | null;
  showPastEvents?: boolean | null;
  createdAt?: string | null;
  isVerified?: boolean;
};

const EVENT_TYPES = [
  { value: 'FESTIVAL', label: 'Festivales' },
  { value: 'CYCLES', label: 'Ciclos' },
  { value: 'TOURS', label: 'Giras' },
  { value: 'ONE_OFF', label: 'Eventos puntuales' },
];

function PromoterPrivateProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PromoterProfile | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [gallery, setGallery] = useState<Array<{ id: string; url: string }>>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [videos, setVideos] = useState<Array<{ id: string; youtubeId: string; title?: string | null }>>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [mediaTab, setMediaTab] = useState<'gallery' | 'videos'>('gallery');
  const hasToken = Boolean(user?.token);

  useEffect(() => {
    if (!user?.token) {
      setLoading(false);
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/promoters/me`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'No se pudo cargar el perfil');
        }
        return res.json();
      })
      .then((data) => {
        setProfile({
          id: data.id,
          name: data.name ?? '',
          city: data.city ?? '',
          country: data.country ?? '',
          description: data.description ?? '',
          eventTypes: data.eventTypes ?? [],
          isPublic: data.isPublic ?? true,
          showPastEvents: data.showPastEvents ?? false,
          createdAt: data.createdAt ?? null,
          isVerified: Boolean(data.isVerified),
        });
      })
      .catch((err: any) => {
        setError(err?.message || 'No se pudo cargar el perfil');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.token]);

  useEffect(() => {
    if (!user?.token) return;
    getProfileImage(user.token)
      .then((result) => setProfileImageUrl(result.url))
      .catch(() => setProfileImageUrl(null));
  }, [user?.token]);

  useEffect(() => {
    if (!profile?.id) return;
    getPromoterGallery(profile.id)
      .then((items) => setGallery(items ?? []))
      .catch(() => setGallery([]));
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    getPromoterVideos(profile.id)
      .then((items) => setVideos(items ?? []))
      .catch(() => setVideos([]));
  }, [profile?.id]);

  const handleSave = async () => {
    if (!user?.token || !profile) return;

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/promoters/me`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: profile.name,
            city: profile.city,
            country: profile.country,
            description: profile.description,
            eventTypes: profile.eventTypes,
            isPublic: profile.isPublic,
            showPastEvents: profile.showPastEvents,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'No se pudo guardar el perfil');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageUpload = async (file?: File | null) => {
    if (!file || !user?.token) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen supera el límite de 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setUploadingImage(true);
    setError(null);
    try {
      await uploadProfileImage(file, user.token);
      const refreshed = await getProfileImage(user.token);
      setProfileImageUrl(refreshed.url);
    } catch (err: any) {
      setError(err?.message || 'No se pudo subir la imagen');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGalleryUpload = async (file?: File | null) => {
    if (!file || !user?.token || !profile?.id) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen supera el límite de 5MB.');
      return;
    }
    setUploadingGallery(true);
    setError(null);
    try {
      await uploadPromoterGalleryImage(file, user.token);
      const refreshed = await getPromoterGallery(profile.id);
      setGallery(refreshed ?? []);
    } catch (err: any) {
      setError(err?.message || 'No se pudo subir la imagen');
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleAddVideo = async () => {
    if (!user?.token || !videoUrl || !profile?.id) return;
    setUploadingVideo(true);
    setError(null);
    try {
      await addPromoterVideo(videoUrl, user.token);
      setVideoUrl('');
      const refreshed = await getPromoterVideos(profile.id);
      setVideos(refreshed ?? []);
    } catch (err: any) {
      setError(err?.message || 'No se pudo añadir el video');
    } finally {
      setUploadingVideo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pb-24">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center animate-pulse mb-4">
          <Sparkles className="w-6 h-6 text-amber-500" />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando tu perfil…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-10 text-center">
        <div className="bg-red-50 text-red-600 font-bold p-6 rounded-3xl border border-red-100">
          {error ?? 'No se pudo cargar el perfil.'}
        </div>
      </div>
    );
  }

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'PR')}&background=1e293b&color=fff&size=256`;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">

      {/* ── HERO EDITABLE (Glass-Fintech) ─────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-fintech-dark pb-28 rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12">

          <div className="flex items-center gap-2 text-amber-400 mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Modo edición de perfil (Promotor)</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
            {/* AVATAR EDITABLE */}
            <div className="relative group shrink-0">
              <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl bg-slate-800">
                <img
                  src={profileImageUrl || fallbackAvatar}
                  alt={profile.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                />

                {/* Overlay Editable */}
                <div
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImage ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white mb-1" />}
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{uploadingImage ? 'Subiendo' : 'Cambiar'}</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleProfileImageUpload(e.target.files?.[0])}
              />
            </div>

            {/* INFO EDITABLE HERO */}
            <div className="flex-1 space-y-3 pb-2 w-full">
              <div className="relative w-full">
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Nombre del Promotor / Productora"
                  className="w-full bg-transparent text-3xl md:text-5xl font-black text-white tracking-tight outline-none border-b-2 border-transparent focus:border-amber-400/50 transition-colors pb-1 placeholder:text-white/20"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-medium text-slate-300">
                <div className="flex items-center gap-2 relative w-full sm:w-auto">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    value={profile.city ?? ''}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="Ciudad base"
                    className="w-full sm:w-auto max-w-[150px] bg-transparent outline-none border-b border-transparent focus:border-amber-400/50 transition-colors pb-0.5 placeholder:text-white/20"
                  />
                </div>

                <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-600" />

                <div className="flex items-center gap-2 relative w-full sm:w-auto">
                  <Globe2 className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    value={profile.country ?? ''}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    placeholder="País de operación"
                    className="w-full sm:w-auto max-w-[150px] bg-transparent outline-none border-b border-transparent focus:border-amber-400/50 transition-colors pb-0.5 placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Event Types Selector (Inline) */}
              <div className="pt-2 flex flex-wrap gap-2">
                {EVENT_TYPES.map((type) => {
                  const active = (profile.eventTypes ?? []).includes(type.value);
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        const current = profile.eventTypes ?? [];
                        const next = active
                          ? current.filter((item) => item !== type.value)
                          : [...current, type.value];
                        setProfile({ ...profile, eventTypes: next });
                      }}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${active
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      {active && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {type.label}
                    </button>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </div>

      {profile.isVerified ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 relative z-20">
          <VerificationBanner />
        </div>
      ) : null}

      {/* ── CUERPO (MAIN) ──────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

        {/* COLUMNA IZQUIERDA (Contenido Principal) */}
        <div className="w-full lg:flex-1 space-y-6">

          {/* Descripción / Biografía */}
          <GlassCard className="p-6 md:p-8">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-slate-400" />
              Acerca del Promotor
            </h2>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none transition-all resize-y min-h-[160px]"
              value={profile.description ?? ''}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              placeholder="Describe tu productora, tu historia, el tipo de eventos que organizas y por qué los artistas deberían trabajar contigo."
              maxLength={1200}
            />
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
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-sm text-slate-500">Sube fotos de tus mejores eventos. Límite: 6 imágenes.</p>
                    <button
                      type="button"
                      disabled={uploadingGallery || gallery.length >= 6}
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {uploadingGallery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      Añadir foto
                    </button>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleGalleryUpload(e.target.files?.[0])}
                    />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {gallery.map((item) => (
                      <div key={item.id} className="relative group overflow-hidden rounded-2xl bg-slate-100 aspect-square">
                        <img src={item.url} alt="Galería" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!user?.token || !profile?.id) return;
                              await deletePromoterGalleryImage(item.id, user.token);
                              const refreshed = await getPromoterGallery(profile.id);
                              setGallery(refreshed ?? []);
                            }}
                            className="bg-red-500/90 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                            title="Eliminar imagen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {gallery.length === 0 && (
                      <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                        <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin imágenes</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mediaTab === 'videos' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Pega un enlace de YouTube "
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      disabled={uploadingVideo || videos.length >= 4 || !videoUrl}
                      onClick={handleAddVideo}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {uploadingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                      Vincular Video
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videos.map((item) => (
                      <div key={item.id} className="relative group overflow-hidden rounded-2xl bg-black aspect-video border border-slate-200">
                        <img src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`} alt="Video" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!user?.token || !profile?.id) return;
                              await deletePromoterVideo(item.id, user.token);
                              const refreshed = await getPromoterVideos(profile.id);
                              setVideos(refreshed ?? []);
                            }}
                            className="bg-red-500/90 text-white rounded-full p-3 hover:bg-red-600 transition-colors shadow-lg pointer-events-auto scale-0 group-hover:scale-100 duration-300"
                            title="Eliminar video"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {videos.length === 0 && (
                      <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                        <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin videos vinculados</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* COLUMNA DERECHA (Tarjetas Fijas / Configuraciones de Privacidad y Guardado) */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-6">

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.04)] space-y-6 lg:sticky lg:top-8 z-10 transition-all hover:border-slate-300 hover:shadow-lg">

            <div>
              <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-4 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-slate-500" /> Visibilidad
              </h3>

              <div className="space-y-4">
                <ToggleRow
                  label="Perfil expuesto"
                  description="Tu perfil aparecerá en búsquedas."
                  value={profile.isPublic ?? true}
                  onChange={(val) => setProfile({ ...profile, isPublic: val })}
                />

                <div className="h-px w-full bg-slate-100 my-2" />

                <ToggleRow
                  label="Eventos pasados"
                  description="Muestra tu historial al público."
                  value={profile.showPastEvents ?? false}
                  onChange={(val) => setProfile({ ...profile, showPastEvents: val })}
                />
              </div>
            </div>

            {error && <p className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-2 rounded-xl text-center uppercase tracking-widest">{error}</p>}

            {saved && (
              <div className="animate-in fade-in slide-in-from-bottom-2 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ficha Actualizada
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !hasToken}
              className="w-full relative overflow-hidden group rounded-2xl bg-amber-500 px-6 py-4 transition-all hover:bg-amber-600 shadow-[0_4px_20px_rgba(245,158,11,0.3)] mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <div className="relative flex items-center justify-center gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-white" />
                )}
                <span className="text-sm font-black uppercase tracking-widest text-white">
                  {saving ? 'Guardando…' : 'Guardar Ficha'}
                </span>
              </div>
            </button>

            <p className="text-[10px] font-medium text-slate-400 text-center uppercase tracking-wider leading-relaxed pt-2">
              Estos cambios impactan inmediatamente tu escaparate público.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
export default withRole(PromoterPrivateProfilePage, ['PROMOTER']);

// ── Components ──────────────────────────────────────────────────

function GlassCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ${className ?? ''}`}>
      {children}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 m-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${active
          ? 'bg-slate-900 text-white shadow-md'
          : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      {icon} {label}
    </button>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer group">
      <div>
        <div className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{label}</div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mt-1">{description}</div>
      </div>
      <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${value ? 'bg-amber-500' : 'bg-slate-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-300 shadow-sm ${value ? 'translate-x-6' : 'translate-x-1'}`} />
        <input
          type="checkbox"
          className="sr-only"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
    </label>
  );
}
