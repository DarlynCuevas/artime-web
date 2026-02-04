import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Link2, Loader2, MapPin, Music, ShieldCheck, Sparkles, Wallet, Calendar as CalendarIcon } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useMe } from '@/context/MeContext';
import { useAuth } from '@/hooks/auth/useAuth';
import { updateMyArtistProfile } from '@/services/artists/artists.service';
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
				<p className="text-sm font-medium text-slate-500">Perfil</p>
				<h1 className="text-3xl font-semibold text-slate-900">Identidad del artista</h1>
				<p className="text-slate-600">Refleja lo que ven salas y promoters. El backend sigue siendo la fuente de verdad.</p>
			</header>

			<section className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<KpiCard icon={<MapPin className="h-4 w-4" />} label="Ciudad" value={profile.city || 'Añade ciudad'} />
				<KpiCard icon={<Wallet className="h-4 w-4" />} label="Caché base" value={formatCurrency(profile.basePrice, profile.currency)} />
				<KpiCard
					icon={<ShieldCheck className="h-4 w-4" />}
					label="Negociación"
					value={profile.isNegotiable ? 'Negociable' : 'No negociable'}
				/>
			</section>

			<section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<Card title="Información básica" icon={<Sparkles className="h-4 w-4 text-slate-600" />}>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Field label="Nombre artístico">
								<input
									className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
									value={profile.name}
									onChange={(e) => handleChange('name', e.target.value)}
								/>
							</Field>
							<Field label="Ciudad">
								<div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
									<MapPin className="h-4 w-4 text-slate-500" />
									<input
										className="w-full text-sm focus:outline-none"
										value={profile.city}
										onChange={(e) => handleChange('city', e.target.value)}
									/>
								</div>
							</Field>
							<Field label="Géneros (coma)">
								<div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
									<Music className="h-4 w-4 text-slate-500" />
									<input
										className="w-full text-sm focus:outline-none"
										value={profile.genres}
										onChange={(e) => handleChange('genres', e.target.value)}
										placeholder="Indie, Rock, Electrónica"
									/>
								</div>
							</Field>
							<Field label="Formato / setup">
								<input
									className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
									value={profile.format}
									onChange={(e) => handleChange('format', e.target.value)}
									placeholder="Solo, banda completa, DJ set"
								/>
							</Field>
						</div>

						<Field label="Biografía" helper="Recomendado: 3-5 frases claras.">
							<textarea
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none min-h-[120px]"
								value={profile.bio}
								onChange={(e) => handleChange('bio', e.target.value)}
							/>
						</Field>
					</Card>

					<Card title="Condiciones" icon={<Wallet className="h-4 w-4 text-slate-600" />}>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Field label="Fee base">
								<input
									type="number"
									className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
									value={profile.basePrice}
									onChange={(e) => handleChange('basePrice', Number(e.target.value))}
								/>
							</Field>
							<Field label="Moneda">
								<input
									className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
									value={profile.currency}
									onChange={(e) => handleChange('currency', e.target.value)}
								/>
							</Field>
							<Field label="Negociable" helper="Visible para la otra parte">
								<label className="inline-flex items-center gap-2 text-sm text-slate-700">
									<input
										type="checkbox"
										checked={profile.isNegotiable}
										onChange={(e) => handleChange('isNegotiable', e.target.checked)}
										className="h-4 w-4"
									/>
									<span>{profile.isNegotiable ? 'Sí, abierto a oferta' : 'No, caché fijo'}</span>
								</label>
							</Field>
						</div>

						<p className="text-xs text-slate-500">La cifra final se confirma en el booking, pero este bloque guía expectativas.</p>
					</Card>

					<Card title="Enlaces y material" icon={<Link2 className="h-4 w-4 text-slate-600" />}>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Field label="Social / EPK">
								<input
									className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
									value={profile.socialLink ?? ''}
									onChange={(e) => handleChange('socialLink', e.target.value)}
									placeholder="https://"
								/>
							</Field>
							<Field label="Tech rider">
								<input
									className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
									value={profile.techRider ?? ''}
									onChange={(e) => handleChange('techRider', e.target.value)}
									placeholder="Drive, PDF, link"
								/>
							</Field>
						</div>
						<p className="text-xs text-slate-500">Estos enlaces pueden compartirse con salas para agilizar decisiones.</p>
					</Card>
				</div>

				<div className="space-y-6">
					<Card title="Vista pública" icon={<ShieldCheck className="h-4 w-4 text-slate-600" />}>
						<div className="space-y-3 text-sm text-slate-700">
							<div className="flex items-start gap-3">
								<div className="h-12 w-12 rounded-lg bg-slate-100" />
								<div className="space-y-1">
									<p className="text-lg font-semibold text-slate-900">{profile.name || 'Tu nombre artístico'}</p>
									<p className="text-xs text-slate-500 flex items-center gap-2">
										<MapPin className="h-3.5 w-3.5" />
										<span>{profile.city || 'Ciudad'}</span>
									</p>
									<div className="flex flex-wrap gap-2">
										{genresList.length === 0 && <span className="text-xs text-slate-500">Añade géneros</span>}
										{genresList.map((genre) => (
											<span key={genre} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
												<Music className="h-3 w-3" />
												{genre}
											</span>
										))}
									</div>
								</div>
							</div>
							<p className="leading-relaxed text-slate-700">{profile.bio || 'Añade una bio breve (3-5 frases) para que las salas te entiendan rápido.'}</p>
							<div className="space-y-1 text-xs text-slate-500">
								<p>
									Formato: <span className="text-slate-800 font-medium">{profile.format || 'Indica setup'}</span>
								</p>
								<p>
									Condiciones: <span className="text-slate-800 font-medium">{formatCurrency(profile.basePrice, profile.currency)} · {profile.isNegotiable ? 'Negociable' : 'No negociable'}</span>
								</p>
							</div>

							{(profile.socialLink || profile.techRider) && (
								<div className="border-t border-slate-100 pt-3 space-y-2">
									{profile.socialLink && (
										<a href={profile.socialLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 hover:text-slate-900">
											<Link2 className="h-3.5 w-3.5" /> Social / EPK
										</a>
									)}
									{profile.techRider && (
										<a href={profile.techRider} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 hover:text-slate-900">
											<Link2 className="h-3.5 w-3.5" /> Tech rider
										</a>
									)}
								</div>
							)}

							<p className="text-xs text-slate-500">Esta vista es la referencia rápida que ve la otra parte.</p>
						</div>
					</Card>

					<Card title="Estado" icon={<AlertCircle className="h-4 w-4 text-slate-600" />}>
						<div className="space-y-3 text-sm text-slate-700">
							<StatusLine label="Rol" value="Artista" />
							<StatusLine label="ID de perfil" value={profile.id ?? '-'} />
							<p className="text-xs text-slate-500">Los datos sensibles como email se gestionan en autenticación.</p>
						</div>
					</Card>

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

function KpiCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
			<div className="px-4 py-3 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
				{icon}
				<span>{label}</span>
			</div>
			<div className="px-4 py-4 bg-slate-900 text-white">
				<p className="text-2xl font-semibold">{value}</p>
			</div>
		</div>
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
