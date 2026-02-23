import { useEffect, useState, type ReactNode } from 'react';
import { Camera, MapPin, Building2, Save, Info, Users, Contact, Globe2, Loader2, Link2, Mail, Phone, Library, Headphones } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useMe } from '@/hooks/auth/useMe';
import { useAuth } from '@/hooks/auth/useAuth';
import { getMyVenueProfile, updateMyVenueProfile } from '@/services/venues/venues.service';

type EditableVenueProfile = {
	name: string;
	city: string;
	address: string;
	capacity: number | null;
	description: string;
	genres: string;
	amenities: string;
	website: string;
	contactEmail: string;
	contactPhone: string;
	profileImageUrl?: string | null;
};

// ==========================================
// COMPONENTES PRINCIPALES
// ==========================================

function VenueProfilePage() {
	const { role, loading: meLoading } = useMe();
	const { user } = useAuth();

	const [profile, setProfile] = useState<EditableVenueProfile | null>(null);
	const [saving, setSaving] = useState(false);
	const [loadingProfile, setLoadingProfile] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	// --- CARGA DE DATOS ---
	useEffect(() => {
		if (!user?.token) {
			setLoadingProfile(false);
			return;
		}

		setLoadingProfile(true);
		setError(null);

		getMyVenueProfile(user.token)
			.then((data) => {
				const initial = data ?? {};
				setProfile({
					name: initial.name ?? '',
					city: initial.city ?? '',
					address: initial.address ?? '',
					capacity: initial.capacity ?? null,
					description: initial.description ?? '',
					genres: Array.isArray(initial.genres) ? initial.genres.join(', ') : initial.genres ?? '',
					amenities: Array.isArray(initial.amenities) ? initial.amenities.join(', ') : initial.amenities ?? '',
					website: initial.website ?? '',
					contactEmail: initial.contactEmail ?? '',
					contactPhone: initial.contactPhone ?? '',
					profileImageUrl: initial.profileImageUrl ?? null,
				});
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoadingProfile(false));
	}, [user?.token]);

	// --- HANDLERS ---
	const handleChange = (field: keyof EditableVenueProfile, value: string | number | null) => {
		setProfile((prev) => (prev ? { ...prev, [field]: value as any } : prev));
	};

	const handleSave = async () => {
		if (!user?.token || !profile) return;
		setSaving(true);
		setError(null);
		setSuccessMsg(null);

		try {
			const payload = {
				name: profile.name,
				city: profile.city,
				address: profile.address,
				capacity: profile.capacity ?? undefined,
				description: profile.description,
				genres: profile.genres.split(',').map((g) => g.trim()).filter(Boolean),
				amenities: profile.amenities.split(',').map((a) => a.trim()).filter(Boolean),
				website: profile.website,
				contactEmail: profile.contactEmail,
				contactPhone: profile.contactPhone,
			};

			const updated = await updateMyVenueProfile(payload, user.token);

			setProfile((prev) =>
				prev
					? {
						...prev,
						name: updated.name ?? prev.name,
						city: updated.city ?? prev.city,
						address: updated.address ?? prev.address,
						capacity: updated.capacity ?? prev.capacity,
						description: updated.description ?? prev.description,
						genres: Array.isArray(updated.genres) ? updated.genres.join(', ') : prev.genres,
						amenities: Array.isArray(updated.amenities) ? updated.amenities.join(', ') : prev.amenities,
						website: updated.website ?? prev.website,
						contactEmail: updated.contactEmail ?? prev.contactEmail,
						contactPhone: updated.contactPhone ?? prev.contactPhone,
					}
					: prev,
			);
			setSuccessMsg('Perfil guardado exitosamente');
			setTimeout(() => setSuccessMsg(null), 3000);
		} catch (err: any) {
			setError(err.message ?? 'Error al guardar');
		} finally {
			setSaving(false);
		}
	};

	// --- RENDER CONDICIONAL (Carga/Error/Role) ---
	if (meLoading || loadingProfile) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center -mt-[73px]">
				<div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
					<div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
						<div className="absolute inset-0 bg-amber-400/20 blur-xl animate-pulse" />
						<Loader2 className="w-8 h-8 text-amber-500 animate-spin relative z-10" />
					</div>
					<span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
						Acondicionando sala…
					</span>
				</div>
			</div>
		);
	}

	if (role !== 'VENUE') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border-t-4 border-rose-500">
					<p className="text-slate-900 font-bold mb-2">Acceso no autorizado</p>
					<p className="text-slate-500 text-sm">Esta sección es solo para Salas de Conciertos (Venues).</p>
				</div>
			</div>
		);
	}

	if (error && !profile) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<p className="text-rose-500 font-semibold">{error}</p>
			</div>
		);
	}

	if (!profile) return null;

	const handleAvatarHover = (e: React.MouseEvent<HTMLLabelElement>) => {
		e.currentTarget.style.transform = 'scale(1.02)';
	};
	const handleAvatarLeave = (e: React.MouseEvent<HTMLLabelElement>) => {
		e.currentTarget.style.transform = 'scale(1)';
	};

	return (
		<div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden">

			{/* ── HERO EDITABLE (DARK MODE) ──────────────────────────────────────────────── */}
			<div className="relative bg-slate-900 border-b border-white/10 shadow-2xl overflow-hidden pt-8 sm:pt-16 pb-[120px] transition-all duration-300 rounded-3xl">
				<div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800" />
				<div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

				<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col md:flex-row items-center md:items-start gap-8">

						{/* Avatar / Imagen de Perfil */}
						<div className="relative group shrink-0">
							<label
								onMouseEnter={handleAvatarHover}
								onMouseLeave={handleAvatarLeave}
								className="block h-36 w-36 sm:h-44 sm:w-44 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-slate-900 shadow-2xl cursor-pointer transition-all duration-300 relative z-10"
								style={{ boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
							>
								{profile.profileImageUrl ? (
									<img src={profile.profileImageUrl} alt="Sala" className="h-full w-full object-cover" />
								) : (
									<span className="text-5xl sm:text-7xl font-light text-slate-600">
										{(profile.name || 'Sala').slice(0, 1).toUpperCase()}
									</span>
								)}

								{/* Overlay Hover para Editar Avatar */}
								<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
									<div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
										<Camera className="w-5 h-5 text-white" />
									</div>
									<span className="text-xs font-semibold text-white tracking-wide">Cambiar Foto</span>
								</div>
								{/* Input oculto real (TODO: Integración futura) */}
								<input type="file" className="hidden" accept="image/*" />
							</label>
							<div className="absolute -inset-1 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
						</div>

						{/* Información Principal Editable */}
						<div className="flex-1 w-full text-center md:text-left space-y-4 md:space-y-6 pt-2">

							{/* Etiqueta + Localización */}
							<div className="flex flex-col md:flex-row items-center md:justify-start gap-4">
								<span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur-md">
									<Building2 className="w-3.5 h-3.5 text-amber-400" />
									Sala de Conciertos
								</span>
								<div className="flex items-center gap-2 text-slate-400 group relative">
									<MapPin className="w-4 h-4 text-emerald-400" />
									<input
										className="bg-transparent border-b border-transparent focus:border-emerald-400/50 hover:border-white/20 outline-none text-sm transition-colors text-center md:text-left placeholder-slate-500 w-[120px]"
										value={profile.city}
										onChange={(e) => handleChange('city', e.target.value)}
										placeholder="Ciudad..."
									/>
								</div>
							</div>

							{/* Nombre Editable */}
							<div className="group relative w-full md:max-w-2xl">
								<input
									className="w-full text-4xl sm:text-5xl lg:text-7xl font-bold text-white tracking-tight bg-transparent border-b-2 border-transparent focus:border-amber-400/50 hover:border-white/10 outline-none transition-all duration-300 placeholder-slate-700 text-center md:text-left truncate"
									value={profile.name}
									onChange={(e) => handleChange('name', e.target.value)}
									placeholder="Nombre de la sala"
								/>
							</div>

							{/* Dirección Editable */}
							<div className="w-full max-w-xl group">
								<div className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 focus-within:bg-slate-800 border-l-2 border-transparent hover:border-emerald-400 focus-within:border-amber-400 rounded-r-xl px-4 py-2 transition-all">
									<span className="text-slate-500 whitespace-nowrap text-sm font-medium">📍 Dirección:</span>
									<input
										className="bg-transparent text-slate-300 text-sm focus:outline-none w-full placeholder-slate-600"
										value={profile.address}
										onChange={(e) => handleChange('address', e.target.value)}
										placeholder="Ej. Calle Mayor, 12, Pta 3..."
									/>
								</div>
							</div>

						</div>
					</div>
				</div>
			</div>

			{/* ── CUERPO (MAIN) ──────────────────────────────────────────────── */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-[80px]">
				<div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">

					{/* Columna Izquierda: Información Detallada */}
					<div className="space-y-6">

						{/* Descripción (Bio) */}
						<GlassCard
							icon={<Info className="w-4 h-4 text-amber-500" />}
							title="Acerca de la sala"
						>
							<textarea
								className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all duration-200 min-h-[140px] resize-y"
								value={profile.description}
								onChange={(e) => handleChange('description', e.target.value)}
								placeholder="Describe tu sala, su acústica, su historia y qué tipo de eventos suelen albergar..."
							/>
						</GlassCard>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Capacidad */}
							<GlassCard
								icon={<Users className="w-4 h-4 text-amber-500" />}
								title="Aforo de la sala"
							>
								<div className="flex bg-slate-50 rounded-xl overflow-hidden border border-slate-200 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all">
									<div className="px-4 py-3 bg-slate-100/50 text-slate-500 text-sm font-medium border-r border-slate-200 flex items-center justify-center">
										Pax.
									</div>
									<input
										type="number"
										className="flex-1 bg-transparent px-4 py-3 outline-none text-slate-900 placeholder-slate-400 font-semibold text-lg"
										value={profile.capacity ?? ''}
										onChange={(e) => handleChange('capacity', e.target.value ? Number(e.target.value) : null)}
										placeholder="Ej: 500"
									/>
								</div>
							</GlassCard>

							{/* Géneros Musicales */}
							<GlassCard
								icon={<Headphones className="w-4 h-4 text-amber-500" />}
								title="Géneros Habituales"
							>
								<div className="flex bg-slate-50 rounded-xl overflow-hidden border border-slate-200 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all">
									<input
										className="flex-1 bg-transparent px-4 py-3 outline-none text-slate-900 placeholder-slate-400 text-sm"
										value={profile.genres}
										onChange={(e) => handleChange('genres', e.target.value)}
										placeholder="Rock, Pop, Electrónica..."
									/>
								</div>
								<p className="text-[10px] text-slate-400 mt-2 ml-1">Separa los estilos con comas (Ej: Indie, Rock).</p>
							</GlassCard>
						</div>

						{/* Equipamiento (Amenities) */}
						<GlassCard
							icon={<Library className="w-4 h-4 text-amber-500" />}
							title="Equipamiento Base (Rider / Backline provisto)"
						>
							<textarea
								className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all duration-200 min-h-[100px] resize-y"
								value={profile.amenities}
								onChange={(e) => handleChange('amenities', e.target.value)}
								placeholder="Ej: Batería pearl completa sin platos, Técnico de sonido INCLUIDO, Limitador 95dbs, Luces LED 12 focos..."
							/>
						</GlassCard>

						{/* Datos de Contacto Externo */}
						<GlassCard
							icon={<Contact className="w-4 h-4 text-amber-500" />}
							title="Medios de Contacto"
						>
							<div className="space-y-4">
								<InputWithIcon
									icon={<Link2 className="w-4 h-4 text-slate-400" />}
									placeholder="Sitio Web (ej. https://mitienda.com)"
									value={profile.website}
									onChange={(e) => handleChange('website', e.target.value)}
								/>
								<InputWithIcon
									icon={<Mail className="w-4 h-4 text-slate-400" />}
									placeholder="Email corporativo (booking@sala.com)"
									value={profile.contactEmail}
									onChange={(e) => handleChange('contactEmail', e.target.value)}
								/>
								<InputWithIcon
									icon={<Phone className="w-4 h-4 text-slate-400" />}
									placeholder="Teléfono (ej. +34 600...)"
									value={profile.contactPhone}
									onChange={(e) => handleChange('contactPhone', e.target.value)}
								/>
							</div>
						</GlassCard>

					</div>

					{/* Columna Derecha: Sticky Action Sidebar */}
					<div className="xl:sticky xl:top-6 space-y-6">

						{/* Action Card Principal */}
						<section className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 p-6 overflow-hidden relative">
							<div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none" />

							<div className="relative z-10 flex flex-col items-center text-center space-y-5">
								<div className="w-16 h-16 bg-white border shadow-sm rounded-full flex items-center justify-center -mb-2">
									<Globe2 className="w-8 h-8 text-slate-300" />
								</div>

								<div>
									<h3 className="text-lg font-bold text-slate-900 tracking-tight">Publicar Perfil</h3>
									<p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
										Asegúrate de comprobar que toda la información comercial de tu sala sea precisa.
									</p>
								</div>

								{error && (
									<div className="w-full bg-rose-50 border border-rose-200 text-rose-600 px-3 py-2 rounded-lg text-xs font-medium">
										{error}
									</div>
								)}
								{successMsg && (
									<div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-2 rounded-lg text-xs font-medium">
										{successMsg}
									</div>
								)}

								<button
									onClick={handleSave}
									disabled={saving}
									className="w-full relative group overflow-hidden rounded-xl bg-slate-900 px-6 py-4 transition-all hover:bg-slate-800 disabled:opacity-70"
								>
									<div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
									<span className="relative z-10 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
										{saving ? (
											<Loader2 className="w-4 h-4 animate-spin text-amber-500" />
										) : (
											<Save className="w-4 h-4 text-amber-500" />
										)}
										{saving ? 'Guardando...' : 'Guardar Cambios'}
									</span>
								</button>
							</div>
						</section>

					</div>
				</div>
			</main>
		</div>
	);
}

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

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
		<section className={`rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden ${className}`}>
			<div className="p-6 sm:p-8">
				{(title || icon) && (
					<header className="flex items-center gap-2 mb-6">
						{icon}
						{title && <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">{title}</h2>}
					</header>
				)}
				{children}
			</div>
		</section>
	);
}

function InputWithIcon({ icon, placeholder, value, onChange }: { icon: ReactNode, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
	return (
		<div className="group relative flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all">
			<div className="pl-4 pr-3 py-3 border-r border-slate-200/60 bg-white group-focus-within:bg-amber-50 transition-colors">
				{icon}
			</div>
			<input
				className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none w-full"
				placeholder={placeholder}
				value={value}
				onChange={onChange}
			/>
		</div>
	);
}

export default withRole(VenueProfilePage, ['VENUE']);
