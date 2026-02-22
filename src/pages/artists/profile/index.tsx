import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Link2, Loader2, MapPin, Music, ShieldCheck, Sparkles, Wallet, Calendar as CalendarIcon } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useMe } from '@/context/MeContext';
import { useAuth } from '@/hooks/auth/useAuth';
import { updateMyArtistProfile } from '@/services/artists/artists.service';
import { deleteArtistGalleryImage, getArtistGallery, uploadArtistGalleryImage } from '@/services/artists/gallery.service';
import { getProfileImage, uploadProfileImage } from '@/services/users/profileImage.service';
import { addArtistVideo, deleteArtistVideo, getArtistVideos } from '@/services/artists/videos.service';
import { useArtistDashboard } from '@/hooks/artists/useArtistDashboard';

type EditableProfile = {
	id?: string;
	name: string;
	city: string;
	genres: string;
	bio: string;
	format: string;
	basePrice: number;
	currency: string;
	isNegotiable: boolean;
	socialLink?: string;
	techRider?: string;
};


function ArtistPrivateProfilePage() {
	const { role, loading: meLoading, profileId } = useMe();
	const { user } = useAuth();
	const { data: dashboard } = useArtistDashboard();
	const [profile, setProfile] = useState<EditableProfile | null>(null);
	const [saving, setSaving] = useState(false);
	const [loadingProfile, setLoadingProfile] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
	const [uploadingImage, setUploadingImage] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [gallery, setGallery] = useState<Array<{ id: string; url: string }>>([]);
	const [uploadingGallery, setUploadingGallery] = useState(false);
	const galleryInputRef = useRef<HTMLInputElement | null>(null);
	const [videos, setVideos] = useState<Array<{ id: string; youtubeId: string; title?: string | null }>>([]);
	const [videoUrl, setVideoUrl] = useState('');
	const [uploadingVideo, setUploadingVideo] = useState(false);
	const [mediaTab, setMediaTab] = useState<'gallery' | 'videos' | 'material'>('gallery');

	const confirmedDates = useMemo(() => {
		const allowed = new Set(['CONTRACT_SIGNED', 'PAID_PARTIAL', 'PAID_FULL']);
		const upcoming = dashboard?.upcomingBookings ?? [];

		return upcoming
			.filter((b) => allowed.has(b.status))
			.filter((b) => Boolean(b.startDate))
			.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
			.slice(0, 4);
	}, [dashboard?.upcomingBookings]);

	useEffect(() => {
		if (!user?.token) {
			setLoadingProfile(false);
			setProfile(null);
			return;
		}

		setLoadingProfile(true);
		setError(null);

		fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/me`, {
			headers: {
				Authorization: `Bearer ${user.token}`,
			},
		})
			.then((res) => {
				if (!res.ok) throw new Error('No se pudo cargar el perfil');
				return res.json();
			})
			.then((data) => {
				setProfile({
					id: profileId,
					name: data.name ?? '',
					city: data.city ?? '',
					genres: Array.isArray(data.genres) ? data.genres.join(', ') : data.genres ?? '',
					bio: data.bio ?? '',
					format: data.format ?? '',
					basePrice: data.basePrice ?? 0,
					currency: data.currency ?? 'EUR',
					isNegotiable: Boolean(data.isNegotiable),
					socialLink: data.socialLink ?? '',
					techRider: data.techRider ?? '',
				});
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoadingProfile(false));
	}, [user?.token, profileId]);

	useEffect(() => {
		if (!user?.token) return;
		getProfileImage(user.token)
			.then((result) => setProfileImageUrl(result.url))
			.catch(() => setProfileImageUrl(null));
	}, [user?.token]);

	useEffect(() => {
		if (!profileId) return;
		getArtistGallery(profileId)
			.then((items) => setGallery(items ?? []))
			.catch(() => setGallery([]));
	}, [profileId]);

	useEffect(() => {
		if (!profileId) return;
		getArtistVideos(profileId)
			.then((items) => setVideos(items ?? []))
			.catch(() => setVideos([]));
	}, [profileId]);

	if (meLoading || loadingProfile) {
		return <div className="p-8 text-slate-700">Cargando perfil…</div>;
	}

	if (role !== 'ARTIST') {
		return <div className="p-8 text-red-600">Acceso no autorizado</div>;
	}

	if (error) {
		return <div className="p-8 text-red-600">{error}</div>;
	}

	if (!profile) {
		return <div className="p-8 text-red-600">No se pudo cargar el perfil.</div>;
	}

	const handleChange = (field: keyof EditableProfile, value: string | number | boolean) => {
		setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
	};

	const handleSave = async () => {
		if (!user?.token || !profile) return;
		setSaving(true);
		setError(null);
		setSaved(false);
		try {
			const payload = {
				name: profile.name,
				city: profile.city,
				genres: profile.genres
					.split(',')
					.map((g) => g.trim())
					.filter(Boolean),
				bio: profile.bio,
				format: profile.format,
				basePrice: profile.basePrice,
				currency: profile.currency,
				isNegotiable: profile.isNegotiable,
			};

			const updated = await updateMyArtistProfile(payload, user.token);

			setProfile((prev) =>
				prev
					? {
						...prev,
						name: updated.name ?? prev.name,
						city: updated.city ?? prev.city,
						genres: Array.isArray(updated.genres) ? updated.genres.join(', ') : prev.genres,
						bio: updated.bio ?? prev.bio,
						format: updated.format ?? prev.format,
						basePrice: updated.basePrice ?? prev.basePrice,
						currency: updated.currency ?? prev.currency,
						isNegotiable: updated.isNegotiable !== undefined ? updated.isNegotiable : prev.isNegotiable,
					}
					: prev,
			);
			setSaved(true);
			setTimeout(() => setSaved(false), 1600);
		} catch (err: any) {
			setError(err.message ?? 'Error al guardar');
		} finally {
			setSaving(false);
		}
	};

	const genresList = profile.genres
		.split(',')
		.map((g) => g.trim())
		.filter(Boolean);

	return (
		<main className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
			<header className="space-y-2">
				<h1 className="text-3xl font-semibold text-slate-900">Perfil profesional</h1>
				<p className="text-slate-600">Refleja lo que ven salas y promoters.</p>
			</header>

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
							(profile.name || 'AR').slice(0, 2).toUpperCase()
						)}
					</div>
					<div className="flex-1 min-w-0 space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<input
								className="text-2xl font-semibold text-slate-900 tracking-tight bg-transparent border-b border-transparent focus:border-slate-300 outline-none"
								value={profile.name}
								onChange={(e) => handleChange('name', e.target.value)}
								placeholder="Nombre artístico"
							/>
							<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
								<ShieldCheck className="h-3.5 w-3.5" /> Perfil verificado en ARTIME
							</span>
						</div>
						<div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
							<span className="flex items-center gap-1.5">
								<MapPin className="h-4 w-4" />
								<input
									className="bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-sm"
									value={profile.city}
									onChange={(e) => handleChange('city', e.target.value)}
									placeholder="Ciudad"
								/>
							</span>
							<span className="flex items-center gap-1.5">
								<Wallet className="h-4 w-4" />
								<input
									type="number"
									className="w-24 bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-sm"
									value={profile.basePrice}
									onChange={(e) => handleChange('basePrice', Number(e.target.value))}
								/>
								<input
									className="w-16 bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-sm"
									value={profile.currency}
									onChange={(e) => handleChange('currency', e.target.value)}
								/>
							</span>
							<label className="inline-flex items-center gap-2 text-sm text-slate-600">
								<input
									type="checkbox"
									checked={profile.isNegotiable}
									onChange={(e) => handleChange('isNegotiable', e.target.checked)}
									className="h-4 w-4"
								/>
								<span>{profile.isNegotiable ? 'Negociable' : 'No negociable'}</span>
							</label>
						</div>
						<div className="flex flex-wrap gap-2">
							<input
								className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
								value={profile.genres}
								onChange={(e) => handleChange('genres', e.target.value)}
								placeholder="Géneros (coma)"
							/>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4">
					<div>
						<label className="text-xs font-medium text-slate-500">Biografía</label>
						<textarea
							className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none min-h-[120px]"
							value={profile.bio}
							onChange={(e) => handleChange('bio', e.target.value)}
							maxLength={1000}
							placeholder="Describe tu propuesta en 3-5 frases claras."
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="text-xs font-medium text-slate-500">Formato / setup</label>
							<input
								className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
								value={profile.format}
								onChange={(e) => handleChange('format', e.target.value)}
								placeholder="Solo, banda completa, DJ set"
							/>
						</div>
					</div>
				</div>

				<div className="border-t border-slate-100 pt-3 space-y-2">
					<p className="text-xs text-slate-500">Imagen de perfil</p>
					<div className="flex items-center gap-2">
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={async (e) => {
								const file = e.target.files?.[0];
								if (!file || !user?.token) return;
								setUploadingImage(true);
								try {
									await uploadProfileImage(file, user.token);
									const refreshed = await getProfileImage(user.token);
									setProfileImageUrl(refreshed.url);
								} finally {
									setUploadingImage(false);
									if (fileInputRef.current) fileInputRef.current.value = '';
								}
							}}
						/>
						<button
							type="button"
							disabled={uploadingImage}
							onClick={() => fileInputRef.current?.click()}
							className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
						>
							{uploadingImage ? 'Subiendo…' : 'Subir imagen'}
						</button>
						{profileImageUrl && (
							<span className="text-xs text-slate-500">Actualizada</span>
						)}
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
							<button
								type="button"
								onClick={() => setMediaTab('material')}
								className={`rounded-full px-3 py-1 border ${mediaTab === 'material' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
							>
								Material
							</button>
						</div>
						{mediaTab === 'gallery' ? (
							<div className="flex items-center gap-2">
								<input
									ref={galleryInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={async (e) => {
										const file = e.target.files?.[0];
										if (!file || !user?.token || !profileId) return;
										setUploadingGallery(true);
										try {
											await uploadArtistGalleryImage(file, user.token);
											const refreshed = await getArtistGallery(profileId);
											setGallery(refreshed ?? []);
										} finally {
											setUploadingGallery(false);
											if (galleryInputRef.current) galleryInputRef.current.value = '';
										}
									}}
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
						) : mediaTab === 'videos' ? (
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
									onClick={async () => {
										if (!user?.token || !videoUrl || !profileId) return;
										setUploadingVideo(true);
										try {
											await addArtistVideo(videoUrl, user.token);
											setVideoUrl('');
											const refreshed = await getArtistVideos(profileId);
											setVideos(refreshed ?? []);
										} finally {
											setUploadingVideo(false);
										}
									}}
									className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
								>
									{uploadingVideo ? 'Añadiendo…' : 'Añadir'}
								</button>
							</div>
						) : (
							<div className="text-xs text-slate-500">Completa tus enlaces operativos.</div>
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
												if (!user?.token || !profileId) return;
												await deleteArtistGalleryImage(item.id, user.token);
												const refreshed = await getArtistGallery(profileId);
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
					) : mediaTab === 'videos' ? (
						videos.length === 0 ? (
							<p className="text-xs text-slate-500">Aún no has añadido videos.</p>
						) : (
							<div className="grid grid-cols-2 gap-2">
								{videos.map((item) => (
									<div key={item.id} className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
										<img src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`} alt="Video" className="h-24 w-full object-cover" />
										<button
											type="button"
											onClick={async () => {
												if (!user?.token || !profileId) return;
												await deleteArtistVideo(item.id, user.token);
												const refreshed = await getArtistVideos(profileId);
												setVideos(refreshed ?? []);
											}}
											className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm"
										>
											Eliminar
										</button>
									</div>
								))}
							</div>
						)
					) : (
						<div className="rounded-xl border border-slate-200 bg-white p-3">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<Field label="EPK / Social">
									<input
										className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
										value={profile.socialLink ?? ''}
										onChange={(e) => handleChange('socialLink', e.target.value)}
										placeholder="https://"
									/>
								</Field>
								<Field label="Rider técnico (PDF o link)">
									<input
										className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
										value={profile.techRider ?? ''}
										onChange={(e) => handleChange('techRider', e.target.value)}
										placeholder="https://"
									/>
								</Field>
							</div>
							<p className="mt-2 text-xs text-slate-500">Se comparten como enlaces directos al iniciar una propuesta.</p>
						</div>
					)}
				</div>
			</section>

			<section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<Card title="Próximas fechas confirmadas" icon={<CalendarIcon />}> 
						<div className="space-y-3 text-sm text-slate-700">
							{confirmedDates.length === 0 && <p className="text-slate-500 text-xs">Sin fechas próximas por ahora.</p>}
							{confirmedDates.map((item) => (
								<div key={`${item.bookingId}-${item.startDate}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
									<div className="flex items-center justify-between text-xs text-slate-500">
										<span>{formatShortDate(item.startDate)}</span>
										<StatusPill status="ACTIVE" />
									</div>
									<p className="text-sm font-medium text-slate-900">{item.venueName}</p>
									<p className="text-xs text-slate-500">Estado: {item.status}</p>
								</div>
							))}
						</div>
					</Card>

					<Card title="Acción" icon={<ShieldCheck className="h-4 w-4 text-slate-600" />}>
						<div className="space-y-3">
							<button
								onClick={handleSave}
								disabled={saving}
								className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
							>
								{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
								{saving ? 'Guardando…' : 'Guardar cambios'}
							</button>
							{saved && <p className="text-xs text-emerald-700 text-center">Cambios guardados.</p>}
						</div>
					</Card>
				</div>
			</section>
		</main>
	);
}
export default withRole(ArtistPrivateProfilePage, ['ARTIST']);

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

function Field({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
	return (
		<label className="space-y-1 text-sm text-slate-700 block">
			<span className="font-medium text-slate-800">{label}</span>
			{children}
			{helper && <span className="text-xs text-slate-500">{helper}</span>}
		</label>
	);
}


function StatusPill({ status }: { status: 'ACTIVE' | 'PAUSED' }) {
	const palette = status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200';
	const label = status === 'ACTIVE' ? 'Activa' : 'Pausada';

	return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${palette}`}>{label}</span>;
}


function StatusLine({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="flex items-center justify-between text-sm text-slate-700">
			<span className="text-slate-500">{label}</span>
			<span className="font-medium text-slate-900">{value}</span>
		</div>
	);
}

function formatCurrency(amount: number, currency: string) {
	return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}

function formatShortDate(value: string) {
	return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}
