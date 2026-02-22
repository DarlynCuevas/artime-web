import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { EyeOff, Globe2, MapPin, ShieldCheck } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { getPromoterGallery } from '@/services/promoters/gallery.service';
import { getPromoterVideos } from '@/services/promoters/videos.service';

type PromoterProfile = {
  id: string;
  name: string;
  city?: string | null;
  country?: string | null;
  description?: string | null;
  eventTypes?: string[];
  isPublic?: boolean | null;
  profileImageUrl?: string | null;
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
        });
      })
      .catch((err: any) => {
        setError(err?.message || 'No se pudo cargar el perfil');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, user?.token]);

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

  if (loading) return <div className="p-8 text-slate-700">Cargando perfil…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!profile) return <div className="p-8 text-slate-600">Perfil no disponible.</div>;

  if (profile.isPublic === false) {
    return (
      <main className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        <Card title="Perfil no disponible" icon={<EyeOff className="h-4 w-4 text-slate-600" />}>
          <p className="text-sm text-slate-700">Este promotor ha decidido ocultar su perfil público.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Perfil profesional</h1>
        <p className="text-slate-600">Define lo que ven artistas y managers al recibir una propuesta.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 text-lg font-semibold overflow-hidden">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={`Foto de ${profile.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              (profile.name || 'PR').slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-semibold text-slate-900 tracking-tight">{profile.name}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5" /> Perfil verificado en ARTIME
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {[profile.city, profile.country].filter(Boolean).join(' · ') || 'Ubicación no indicada'}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe2 className="h-4 w-4" />
                {profile.country || 'País no indicado'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile.eventTypes ?? []).length === 0 && (
                <span className="text-xs text-slate-500">Tipos de eventos no indicados</span>
              )}
              {(profile.eventTypes ?? []).map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
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
            gallery.length === 0 ? (
              <p className="text-xs text-slate-500">Aún no hay imágenes.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {gallery.map((item) => (
                  <div key={item.id} className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img src={item.url} alt="Imagen de galería" className="h-24 w-full object-cover" />
                  </div>
                ))}
              </div>
            )
          ) : videos.length === 0 ? (
            <p className="text-xs text-slate-500">Aún no hay videos.</p>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <Card title="Biografía" icon={<ShieldCheck className="h-4 w-4 text-slate-600" />}>
          <div className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 whitespace-pre-line">
            {profile.description || 'Sin biografía pública.'}
          </div>
        </Card>
      </section>
    </main>
  );
}

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
