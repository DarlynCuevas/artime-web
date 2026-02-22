import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Eye, Globe2, Loader2, MapPin, ShieldCheck } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { withRole } from '@/components/auth/withRole';
import { getProfileImage, uploadProfileImage } from '@/services/users/profileImage.service';
import { deletePromoterGalleryImage, getPromoterGallery, uploadPromoterGalleryImage } from '@/services/promoters/gallery.service';
import { addPromoterVideo, deletePromoterVideo, getPromoterVideos } from '@/services/promoters/videos.service';

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
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'No se pudo guardar el perfil');
      }
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 1500);
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

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Perfil profesional</h1>
        <p className="text-slate-600">Define lo que ven artistas y managers al recibir una propuesta.</p>
      </header>

      {loading && <div className="p-4 text-slate-700">Cargando…</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {!loading && profile && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 text-lg font-semibold overflow-hidden">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                    onError={() => setProfileImageUrl(null)}
                  />
                ) : (
                  (profile.name || 'PR').slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="text-2xl font-semibold text-slate-900 tracking-tight bg-transparent border-b border-transparent focus:border-slate-300 outline-none"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Nombre del promotor"
                  />
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Perfil verificado en ARTIME
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <input
                      value={profile.city ?? ''}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      className="bg-transparent border-b border-transparent focus:border-slate-300 outline-none"
                      placeholder="Ciudad base"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4" />
                    <input
                      value={profile.country ?? ''}
                      onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                      className="bg-transparent border-b border-transparent focus:border-slate-300 outline-none"
                      placeholder="País"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
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
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                          active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="font-medium text-slate-800">Imagen de perfil</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => handleProfileImageUpload(e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {uploadingImage ? 'Subiendo…' : 'Subir imagen'}
                </button>
                {profileImageUrl && <span className="text-xs text-slate-500">Actualizada</span>}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setMediaTab('gallery')}
                    className={`rounded-full px-3 py-1 border ${mediaTab === 'gallery' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                  >
                    Galería
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTab('videos')}
                    className={`rounded-full px-3 py-1 border ${mediaTab === 'videos' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                  >
                    Videos
                  </button>
                </div>
                {mediaTab === 'gallery' ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={(e) => handleGalleryUpload(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      disabled={uploadingGallery || gallery.length >= 6}
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {uploadingGallery ? 'Subiendo…' : 'Subir'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={videoUrl ?? ''}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Enlace de YouTube"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      disabled={uploadingVideo || videos.length >= 4 || !videoUrl}
                      onClick={handleAddVideo}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {uploadingVideo ? 'Añadiendo…' : 'Añadir'}
                    </button>
                  </div>
                )}
              </div>
              {mediaTab === 'gallery' ? (
                gallery.length === 0 ? (
                  <p className="text-xs text-slate-500">Aún no has subido imágenes.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {gallery.map((item) => (
                      <div key={item.id} className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <img src={item.url} alt="Imagen de galería" className="h-24 w-full object-cover" />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!user?.token || !profile.id) return;
                            await deletePromoterGalleryImage(item.id, user.token);
                            const refreshed = await getPromoterGallery(profile.id);
                            setGallery(refreshed ?? []);
                          }}
                          className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : videos.length === 0 ? (
                <p className="text-xs text-slate-500">Aún no has añadido videos.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {videos.map((item) => (
                    <div key={item.id} className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      <iframe
                        className="h-24 w-full"
                        src={`https://www.youtube.com/embed/${item.youtubeId}`}
                        title="Video de YouTube"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!user?.token || !profile.id) return;
                          await deletePromoterVideo(item.id, user.token);
                          const refreshed = await getPromoterVideos(profile.id);
                          setVideos(refreshed ?? []);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <Card title="Biografía" icon={<ShieldCheck className="h-4 w-4 text-slate-600" />}>
              <textarea
                rows={6}
                value={profile.description ?? ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                maxLength={1000}
                placeholder="Describe tu actividad como promotor."
              />
            </Card>

            <Card title="Visibilidad" icon={<Eye className="h-4 w-4 text-slate-600" />}>
              <div className="space-y-4">
                <ToggleRow
                  label="Perfil público"
                  description="Tu perfil aparece en búsquedas y propuestas."
                  value={profile.isPublic ?? true}
                  onChange={(value) => setProfile({ ...profile, isPublic: value })}
                />
                <ToggleRow
                  label="Mostrar eventos pasados"
                  description="Enseña el historial de conciertos públicos."
                  value={profile.showPastEvents ?? false}
                  onChange={(value) => setProfile({ ...profile, showPastEvents: value })}
                />
              </div>
            </Card>

            <Card title="Acción" icon={<CheckCircle2 className="h-4 w-4 text-slate-600" />}>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !hasToken}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
                {saved && <p className="text-xs text-emerald-700 text-center">Guardado.</p>}
                <p className="text-xs text-slate-500 text-center">Los cambios impactan tu ficha pública de promotor.</p>
              </div>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}

export default withRole(PromoterPrivateProfilePage, ['PROMOTER']);

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
      <header className="flex items-center gap-2 text-slate-900 font-semibold">
        {icon}
        <h2>{title}</h2>
      </header>
      {children}
    </section>
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
    <label className="flex items-start justify-between gap-4 text-sm text-slate-700">
      <span>
        <span className="font-medium text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      <input type="checkbox" className="h-4 w-4" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
