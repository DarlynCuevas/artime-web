import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Camera, CheckCircle2, Link2, Loader2, MapPin, Music, ShieldCheck, Sparkles, Wallet, Calendar as CalendarIcon, Edit3, Image as ImageIcon, Video, FileText, Trash2, Globe, Clock, Plus } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useMe } from '@/context/MeContext';
import { useAuth } from '@/hooks/auth/useAuth';
import { updateMyArtistProfile } from '@/services/artists/artists.service';
import { deleteArtistGalleryImage, getArtistGallery, uploadArtistGalleryImage } from '@/services/artists/gallery.service';
import { getProfileImage, uploadProfileImage } from '@/services/users/profileImage.service';
import { addArtistVideo, deleteArtistVideo, getArtistVideos } from '@/services/artists/videos.service';
import { useArtistDashboard } from '@/hooks/artists/useArtistDashboard';
import { VerificationBanner } from '@/components/profile/VerificationBanner';
import { normalizeArtistBookingConditions, type ArtistBookingConditions } from '@/types/artists/booking-conditions';

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
	isVerified?: boolean;
	bookingConditions: ArtistBookingConditions;
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
			headers: { Authorization: `Bearer ${user.token}` },
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
					isVerified: Boolean(data.isVerified),
					bookingConditions: normalizeArtistBookingConditions(data.bookingConditions ?? null),
				});
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoadingProfile(false));
	}, [user?.token, profileId]);

	useEffect(() => {
		if (!profileId) return;
		getArtistGallery(profileId).then((items) => setGallery(items ?? [])).catch(() => setGallery([]));
	}, [profileId]);

	useEffect(() => {
		if (!profileId) return;
		getArtistVideos(profileId).then((items) => setVideos(items ?? [])).catch(() => setVideos([]));
	}, [profileId]);

	if (meLoading || loadingProfile) {
		return (
			<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pb-24">
				<div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center animate-pulse mb-4">
					<Sparkles className="w-6 h-6 text-amber-500" />
				</div>
				<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando tu perfil…</p>
			</div>
		);
	}

	if (role !== 'ARTIST') {
		return <div className="p-8 text-red-600 font-bold">Acceso no autorizado</div>;
	}

	if (error || !profile) {
		return <div className="p-8 text-red-600 font-bold">{error ?? 'No se pudo cargar'}</div>;
	}

	const handleChange = (field: keyof EditableProfile, value: string | number | boolean) => {
		setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
	};

	const handleConditionChange = (field: keyof ArtistBookingConditions, value: string | number | boolean | null) => {
		setProfile((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				bookingConditions: {
					...prev.bookingConditions,
					[field]: value as ArtistBookingConditions[typeof field],
				},
			};
		});
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
				genres: profile.genres.split(',').map((g) => g.trim()).filter(Boolean),
				bio: profile.bio,
				format: profile.format,
				basePrice: profile.basePrice,
				currency: profile.currency,
				isNegotiable: profile.isNegotiable,
				bookingConditions: normalizeArtistBookingConditions(profile.bookingConditions),
			};

			const updated = await updateMyArtistProfile(payload, user.token);

			setProfile((prev) =>
				prev ? {
					...prev,
					name: updated.name ?? prev.name,
					city: updated.city ?? prev.city,
					genres: Array.isArray(updated.genres) ? updated.genres.join(', ') : prev.genres,
					bio: updated.bio ?? prev.bio,
					format: updated.format ?? prev.format,
					basePrice: updated.basePrice ?? prev.basePrice,
					currency: updated.currency ?? prev.currency,
					isNegotiable: updated.isNegotiable !== undefined ? updated.isNegotiable : prev.isNegotiable,
					bookingConditions: normalizeArtistBookingConditions(updated.bookingConditions ?? prev.bookingConditions),
				} : prev,
			);
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Error al guardar');
		} finally {
			setSaving(false);
		}
	};

	const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'AR')}&background=1e293b&color=fff&size=256`;

	return (
		<div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">

			{/* ── HERO EDITABLE (Glass-Fintech) ─────────────────────────────── */}
			<div className="relative w-full overflow-hidden bg-fintech-dark pb-28 rounded-3xl">
				<div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
				<div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
				<div className="absolute -left-32 -bottom-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />
				{profile.isVerified ? (
					<VerificationBanner
						variant="badge"
						className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6"
					/>
				) : null}

				<div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12">

					<div className="flex items-center gap-2 text-amber-400 mb-6">
						<Edit3 className="w-4 h-4" />
						<span className="text-[10px] font-black uppercase tracking-widest">Modo edición de perfil</span>
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
								onChange={async (e) => {
									const file = e.target.files?.[0];
									if (!file || !user?.token) return;
									setUploadingImage(true);
									try {
										await uploadProfileImage(file, user.token, 'ARTIST');
										const refreshed = await getProfileImage(user.token);
										setProfileImageUrl(refreshed.url);
									} finally {
										setUploadingImage(false);
										if (fileInputRef.current) fileInputRef.current.value = '';
									}
								}}
							/>
						</div>

						{/* INFO EDITABLE HERO */}
						<div className="flex-1 space-y-3 pb-2 w-full">
							<div className="relative group">
								<input
									value={profile.name}
									onChange={(e) => handleChange('name', e.target.value)}
									placeholder="Tu nombre artístico"
									className="w-full bg-transparent text-3xl md:text-5xl font-black text-white tracking-tight outline-none border-b-2 border-transparent focus:border-amber-400/50 transition-colors pb-1 placeholder:text-white/20"
								/>
								<Edit3 className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/0 group-hover:text-white/30 transition-colors pointer-events-none" />
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-medium text-slate-300">
								<div className="flex items-center gap-2 relative group w-full sm:w-auto">
									<MapPin className="h-4 w-4 text-slate-400 shrink-0" />
									<input
										value={profile.city}
										onChange={(e) => handleChange('city', e.target.value)}
										placeholder="Ciudad base"
										className="w-full sm:w-auto max-w-[150px] bg-transparent outline-none border-b border-transparent focus:border-amber-400/50 transition-colors pb-0.5 placeholder:text-white/20"
									/>
								</div>

								<span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-600" />

								<div className="flex items-center gap-2 relative group w-full sm:w-auto">
									<Music className="h-4 w-4 text-slate-400 shrink-0" />
									<input
										value={profile.genres}
										onChange={(e) => handleChange('genres', e.target.value)}
										placeholder="Géneros (separados por coma)"
										className="w-full sm:w-auto min-w-[200px] bg-transparent outline-none border-b border-transparent focus:border-amber-400/50 transition-colors pb-0.5 placeholder:text-white/20"
									/>
								</div>

								<span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-600" />

								<div className="flex items-center gap-2 relative group w-full sm:w-auto">
									<span className="h-4 w-4 rounded-full border border-slate-400 shrink-0 flex items-center justify-center text-[8px]">F</span>
									<input
										value={profile.format}
										onChange={(e) => handleChange('format', e.target.value)}
										placeholder="Formato (ej. Banda, DJ)"
										className="w-full sm:w-auto max-w-[140px] bg-transparent outline-none border-b border-transparent focus:border-amber-400/50 transition-colors pb-0.5 placeholder:text-white/20"
									/>
								</div>
							</div>
						</div>

					</div>
				</div>
			</div>

			{/* ── CUERPO (MAIN) ──────────────────────────────────────────────── */}
			<main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

				{/* COLUMNA IZQUIERDA (Contenido Principal) */}
				<div className="w-full lg:flex-1 space-y-6">

					{/* Biografía */}
					<GlassCard className="p-6 md:p-8">
						<h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
							<FileText className="w-4 h-4 text-slate-400" />
							Acerca del artista
						</h2>
						<textarea
							className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none transition-all resize-y min-h-[160px]"
							value={profile.bio}
							onChange={(e) => handleChange('bio', e.target.value)}
							placeholder="Presenta tu propuesta artística. Destaca años de experiencia, estilo propio y todo lo que pueda atraer al venue."
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
								label={`Galería (${gallery.length})`}
							/>
							<TabButton
								active={mediaTab === 'videos'}
								onClick={() => setMediaTab('videos')}
								icon={<Video className="w-3.5 h-3.5" />}
								label={`Videos (${videos.length})`}
							/>
							<TabButton
								active={mediaTab === 'material'}
								onClick={() => setMediaTab('material')}
								icon={<Link2 className="w-3.5 h-3.5" />}
								label="Material Operativo"
							/>
						</div>

						{/* Tab Panes */}
						<div className="p-6 md:p-8">
							{mediaTab === 'gallery' && (
								<div className="space-y-6">
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
										<p className="text-sm text-slate-500">Sube hasta 6 imágenes en alta calidad (portafolio).</p>
										<button
											type="button"
											disabled={uploadingGallery || gallery.length >= 6}
											onClick={() => galleryInputRef.current?.click()}
											className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 shrink-0"
										>
											{uploadingGallery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
											Añadir imagen
										</button>
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
									</div>

									<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
										{gallery.map((item) => (
											<div key={item.id} className="relative group overflow-hidden rounded-2xl bg-slate-100 aspect-square">
												<img src={item.url} alt="Galería" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
												<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
													<button
														type="button"
														onClick={async () => {
															if (!user?.token || !profileId) return;
															await deleteArtistGalleryImage(item.id, user.token);
															const refreshed = await getArtistGallery(profileId);
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
											placeholder="Pega un enlace de YouTube completo (ej. https://youtube.com/watch?v=...)"
											className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none transition-all placeholder:text-slate-400"
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
											className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0"
										>
											{uploadingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
											Añadir Video
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
															if (!user?.token || !profileId) return;
															await deleteArtistVideo(item.id, user.token);
															const refreshed = await getArtistVideos(profileId);
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

							{mediaTab === 'material' && (
								<div className="space-y-6">
									<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
										<div>
											<label className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
												<Globe className="w-3.5 h-3.5" /> Enlace Social / EPK Principal
											</label>
											<input
												type="url"
												className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none transition-all"
												value={profile.socialLink ?? ''}
												onChange={(e) => handleChange('socialLink', e.target.value)}
												placeholder="https://instagram.com/tu_perfil"
											/>
										</div>
										<div>
											<label className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
												<FileText className="w-3.5 h-3.5" /> Enlace al Rider Técnico (PDF)
											</label>
											<input
												type="url"
												className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none transition-all"
												value={profile.techRider ?? ''}
												onChange={(e) => handleChange('techRider', e.target.value)}
												placeholder="Enlace público de Drive, Dropbox, etc."
											/>
										</div>
									</div>
									<p className="text-xs text-slate-500 text-center">
										Esta información será enviada automáticamente a los venues cuando inicies una negociación.
									</p>
								</div>
							)}
						</div>
					</GlassCard>
				</div>

				{/* COLUMNA DERECHA (Tarjetas Fijas) */}
				<div className="w-full lg:w-[320px] shrink-0 space-y-6">

					{/* Tarjeta de Guardar Cambios (equivalente a PricingCard) */}
					<div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-[0_20px_50px_rgba(251,191,36,0.15)] space-y-6 lg:sticky lg:top-8 z-10">
						<div>
							<p className="text-[10px] font-black tracking-widest uppercase text-amber-600 mb-1">Caché Base</p>
							<div className="flex items-end gap-3 mb-3">
								<input
									type="number"
									value={profile.basePrice}
									onChange={(e) => handleChange('basePrice', Number(e.target.value))}
									className="w-40 bg-transparent text-4xl font-black text-slate-900 border-b-2 border-slate-200 focus:border-amber-400 outline-none p-0 tracking-tighter transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
								/>
								<select
									value={profile.currency}
									onChange={(e) => handleChange('currency', e.target.value)}
									className="bg-transparent text-lg font-bold text-slate-500 border-none outline-none appearance-none cursor-pointer hover:text-slate-800 pb-1 shrink-0"
								>
									<option value="EUR">EUR</option>
									<option value="USD">USD</option>
								</select>
							</div>

							<label className="flex items-center gap-2 mt-4 cursor-pointer group">
								<div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${profile.isNegotiable ? 'bg-amber-500' : 'bg-slate-200 border border-slate-300'}`}>
									{profile.isNegotiable && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
								</div>
								<input
									type="checkbox"
									checked={profile.isNegotiable}
									onChange={(e) => handleChange('isNegotiable', e.target.checked)}
									className="hidden"
								/>
								<span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Precio Negociable</span>
							</label>
						</div>

						{error && <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
						{saved && (
							<div className="animate-in fade-in slide-in-from-bottom-2 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl text-center flex items-center justify-center gap-1">
								<CheckCircle2 className="w-3.5 h-3.5" /> Cambios Públicos
							</div>
						)}

						<button
							onClick={handleSave}
							disabled={saving}
							className="w-full relative overflow-hidden group rounded-2xl bg-slate-900 px-6 py-4 transition-all hover:bg-slate-800 shadow-[0_0_0_1px_theme(colors.slate.900)] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
							<div className="relative flex items-center justify-center gap-2">
								{saving ? (
									<Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
								) : (
									<Sparkles className="h-4 w-4 text-amber-400" />
								)}
								<span className="text-sm font-black uppercase tracking-widest text-white">
									{saving ? 'Guardando…' : 'Guardar Cambios'}
								</span>
							</div>
						</button>
					</div>

					<div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.04)] space-y-4">
						<div>
							<p className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-1">Condiciones de contratación</p>
							<p className="text-xs text-slate-500">No negociables para quien inicia booking.</p>
						</div>
						<div className="grid grid-cols-3 gap-2">
							<input
								type="number"
								value={profile.bookingConditions.crewSize ?? ''}
								onChange={(e) => handleConditionChange('crewSize', e.target.value ? Number(e.target.value) : null)}
								placeholder="Crew"
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none"
							/>
							<input
								type="number"
								value={profile.bookingConditions.hotelRooms ?? ''}
								onChange={(e) => handleConditionChange('hotelRooms', e.target.value ? Number(e.target.value) : null)}
								placeholder="Habitaciones"
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none"
							/>
							<input
								type="number"
								value={profile.bookingConditions.hotelNights ?? ''}
								onChange={(e) => handleConditionChange('hotelNights', e.target.value ? Number(e.target.value) : null)}
								placeholder="Noches"
								className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none"
							/>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer">
								<input
									type="checkbox"
									checked={profile.bookingConditions.requiresFlights}
									onChange={(e) => handleConditionChange('requiresFlights', e.target.checked)}
								/>
								Requiere vuelos
							</label>
							<label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer">
								<input
									type="checkbox"
									checked={profile.bookingConditions.requiresGroundTransport}
									onChange={(e) => handleConditionChange('requiresGroundTransport', e.target.checked)}
								/>
								Transporte local
							</label>
						</div>
						<textarea
							value={profile.bookingConditions.hospitalityNotes}
							onChange={(e) => handleConditionChange('hospitalityNotes', e.target.value)}
							placeholder="Hospitality (catering, camerino, etc.)"
							className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none min-h-[72px]"
						/>
						<textarea
							value={profile.bookingConditions.technicalNotes}
							onChange={(e) => handleConditionChange('technicalNotes', e.target.value)}
							placeholder="Notas técnicas"
							className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none min-h-[72px]"
						/>
						<textarea
							value={profile.bookingConditions.additionalNotes}
							onChange={(e) => handleConditionChange('additionalNotes', e.target.value)}
							placeholder="Notas adicionales"
							className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none min-h-[72px]"
						/>
					</div>

					{/* Fechas Confirmadas (Equivalente al Booking Section del público) */}
					<GlassCard className="p-6 border-slate-200 shadow-sm">
						<h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
							<CalendarIcon className="w-4 h-4 text-emerald-600" />
							Upcoming Confirmado
						</h3>

						<div className="space-y-3">
							{confirmedDates.length === 0 ? (
								<div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl">
									<Clock className="w-5 h-5 text-slate-300 mx-auto mb-2" />
									<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agenda Libre</p>
								</div>
							) : (
								confirmedDates.map((item) => (
									<div key={`${item.bookingId}-${item.startDate}`} className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
										<div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center shrink-0 border border-emerald-100/50">
											<span className="text-[10px] font-bold uppercase tracking-wider leading-none">{new Date(item.startDate).toLocaleDateString('es-ES', { month: 'short' })}</span>
											<span className="text-sm font-black leading-none mt-0.5">{new Date(item.startDate).getDate()}</span>
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-bold text-slate-900 truncate">{item.venueName}</p>
											<span className="inline-flex items-center px-1.5 pt-[1px] rounded flex items-center justify-center bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-widest mt-1">
												Confirmado
											</span>
										</div>
									</div>
								))
							)}
						</div>
					</GlassCard>

				</div>
			</main>
		</div>
	);
}
export default withRole(ArtistPrivateProfilePage, ['ARTIST']);

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
