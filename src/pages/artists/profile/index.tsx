import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  Loader2,
  MapPin,
  Music,
  ShieldCheck,
  Sparkles,
  Wallet,
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  User,
  Globe,
  Settings,
  FileText
} from 'lucide-react';
import Link from 'next/link';

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
		return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 animate-pulse font-medium text-sm">
          <Clock className="h-4 w-4" />
          <span>Sincronizando identidad del artista...</span>
        </div>
      </div>
    );
	}

	if (role !== 'ARTIST') {
		return (
      <div className="p-8">
        <div className="max-w-md mx-auto rounded-xl border border-red-100 bg-red-50 p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-bold">Acceso no autorizado</p>
        </div>
      </div>
    );
	}

	if (error) {
		return (
      <div className="p-8">
        <div className="max-w-md mx-auto rounded-xl border border-red-100 bg-red-50 p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      </div>
    );
	}

	if (!profile) {
		return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500 font-medium">No se pudo cargar el perfil operativo.</p>
        <button onClick={() => window.location.reload()} className="text-xs font-black uppercase tracking-widest text-slate-900 hover:underline">Reintentar conexión</button>
      </div>
    );
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
		<main className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <header className="border-b border-slate-100 pb-8 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-900" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Artime OS · Profile Settings</p>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Configuración de identidad</h1>
        <p className="text-sm text-slate-500 max-w-2xl">Gestiona tu presencia profesional. Estos datos definen tu visibilidad ante salas y promotores.</p>
      </header>

			<section className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<KpiCard icon={<MapPin className="h-4 w-4" />} label="Ubicación Base" value={profile.city || 'Pendiente'} />
				<KpiCard icon={<Wallet className="h-4 w-4" />} label="Fee Operativo" value={formatCurrency(profile.basePrice, profile.currency)} />
				<KpiCard
					icon={<ShieldCheck className="h-4 w-4" />}
					label="Política de Precios"
					value={profile.isNegotiable ? 'Abierto a oferta' : 'Tarifa fija'}
          tone={profile.isNegotiable ? 'emerald' : 'slate'}
				/>
			</section>

			<section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
				<div className="lg:col-span-8 space-y-10">
					<Card title="Información profesional" subtitle="Identidad y trayectoria" icon={<User className="h-4 w-4" />}>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<Field label="Nombre del proyecto">
								<input
									className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
									value={profile.name}
									onChange={(e) => handleChange('name', e.target.value)}
								/>
							</Field>
							<Field label="Ciudad principal">
								<div className="relative group">
									<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-900" />
									<input
										className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
										value={profile.city}
										onChange={(e) => handleChange('city', e.target.value)}
									/>
								</div>
							</Field>
							<Field label="Géneros (separados por coma)">
								<div className="relative group">
									<Music className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-900" />
									<input
										className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
										value={profile.genres}
										onChange={(e) => handleChange('genres', e.target.value)}
										placeholder="Ej: Indie, Rock, Electrónica"
									/>
								</div>
							</Field>
							<Field label="Formato de directo">
								<input
									className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
									value={profile.format}
									onChange={(e) => handleChange('format', e.target.value)}
									placeholder="Ej: Banda completa, DJ Set, Acústico"
								/>
							</Field>
						</div>

						<div className="pt-4">
              <Field label="Biografía artística" helper="Recomendado: 3-5 frases de alto impacto.">
                <textarea
                  className="w-full min-h-[160px] p-6 rounded-2xl border border-slate-200 bg-white text-[14px] font-medium leading-relaxed placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none resize-none shadow-inner bg-slate-50/20"
                  value={profile.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                />
              </Field>
            </div>
					</Card>

					<Card title="Condiciones de contratación" subtitle="Parámetros económicos" icon={<Wallet className="h-4 w-4" />}>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							<Field label="Caché base">
								<div className="relative">
                  <input
                    type="number"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[15px] font-bold tabular-nums text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
                    value={profile.basePrice}
                    onChange={(e) => handleChange('basePrice', Number(e.target.value))}
                  />
                </div>
							</Field>
							<Field label="Divisa">
								<input
									className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
									value={profile.currency}
									onChange={(e) => handleChange('currency', e.target.value)}
								/>
							</Field>
							<Field label="Estado de negociación" helper="Visible para el contratante">
								<label className="flex items-center gap-3 h-11 px-4 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer group hover:bg-slate-50 transition-colors mt-0.5">
									<input
										type="checkbox"
										checked={profile.isNegotiable}
										onChange={(e) => handleChange('isNegotiable', e.target.checked)}
										className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
									/>
									<span className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">{profile.isNegotiable ? 'Abierto a oferta' : 'Tarifa fija'}</span>
								</label>
							</Field>
						</div>

						<p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
              * El caché final se formalizará en cada booking individual según el rider y logística.
            </p>
					</Card>

					<Card title="Material promocional" subtitle="Trazabilidad y recursos" icon={<Link2 className="h-4 w-4" />}>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<Field label="Enlace EPK / Social">
								<div className="relative group">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-900" />
                  <input
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
                    value={profile.socialLink ?? ''}
                    onChange={(e) => handleChange('socialLink', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
							</Field>
							<Field label="Rider técnico (Cloud link)">
								<div className="relative group">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-900" />
                  <input
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
                    value={profile.techRider ?? ''}
                    onChange={(e) => handleChange('techRider', e.target.value)}
                    placeholder="Dropbox, Drive, PDF..."
                  />
                </div>
							</Field>
						</div>
					</Card>
				</div>

				<div className="lg:col-span-4 space-y-8">
					<Card title="Preview público" subtitle="Referencia rápida para el cliente" icon={<Globe className="h-4 w-4" />}>
						<div className="space-y-6 bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10 border border-white/5">
							<div className="flex items-start gap-4">
								<div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                   <User className="size-7 text-white/40" />
                </div>
								<div className="space-y-1 min-w-0">
									<p className="text-lg font-black tracking-tight text-white truncate leading-none pt-1">{profile.name || 'Tu marca'}</p>
									<p className="text-[11px] font-bold text-white/40 flex items-center gap-1.5 uppercase tracking-widest">
										<MapPin className="size-3" />
										<span>{profile.city || '—'}</span>
									</p>
									<div className="flex flex-wrap gap-1.5 pt-2">
										{genresList.map((genre) => (
											<span key={genre} className="text-[9px] font-black uppercase tracking-tighter bg-white/10 text-white/80 px-2 py-0.5 rounded">
												{genre}
											</span>
										))}
									</div>
								</div>
							</div>

              <div className="h-px bg-white/5" />

							<p className="text-[13px] font-medium leading-relaxed text-white/60 line-clamp-4">
                {profile.bio || 'La bio proyecta tu valor artístico. Completa este campo para mejorar el ratio de booking.'}
              </p>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Caché Neto</span>
                   <span className="text-[14px] font-black tabular-nums">{formatCurrency(profile.basePrice, profile.currency)}</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Negociación</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${profile.isNegotiable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/60'}`}>
                    {profile.isNegotiable ? 'Activa' : 'Cerrada'}
                   </span>
                </div>
              </div>

							{(profile.socialLink || profile.techRider) && (
								<div className="flex flex-wrap gap-2 pt-2">
									{profile.socialLink && (
										<div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 text-white px-3 py-2 rounded-lg border border-white/5">
											<Link2 className="size-3" /> EPK
										</div>
									)}
									{profile.techRider && (
										<div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 text-white px-3 py-2 rounded-lg border border-white/5">
											<FileText className="size-3" /> Tech
										</div>
									)}
								</div>
							)}
						</div>
					</Card>

					<Card title="Registro de auditoría" subtitle="Integridad de la cuenta" icon={<ShieldCheck className="h-4 w-4" />}>
						<div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
							<StatusLine label="Rol en sistema" value="ARTISTA" />
							<div className="h-px bg-slate-100" />
							<div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">UUID Perfil</p>
                <p className="text-[11px] font-mono text-slate-500 break-all">{profile.id || '—'}</p>
              </div>
						</div>
					</Card>

					<Card title="Próximas fechas" subtitle="Monitor de agenda" icon={<CalendarIcon className="h-4 w-4" />}>
						<div className="space-y-3">
							{confirmedDates.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sin compromisos</p>
                </div>
              ) : (
                confirmedDates.map((item) => (
                  <div key={`${item.bookingId}-${item.startDate}`} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col gap-2 hover:border-slate-900 transition-all cursor-default">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-black text-slate-900 tabular-nums uppercase">{formatShortDate(item.startDate)}</span>
                      <StatusPill status="ACTIVE" />
                    </div>
                    <p className="text-[13px] font-bold text-slate-600 truncate">{item.venueName}</p>
                  </div>
                ))
              )}
						</div>
					</Card>

					<div className="sticky bottom-6 pt-4">
						<button
							onClick={handleSave}
							disabled={saving}
							className="w-full h-14 inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-900 text-white text-[15px] font-black hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-900/10 group"
						>
							{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />}
							{saving ? 'Guardando identidad...' : 'Actualizar perfil operativo'}
						</button>
						{saved && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700">Cambios aplicados con éxito</p>
              </div>
            )}
					</div>
				</div>
			</section>
		</main>
	);
}
export default withRole(ArtistPrivateProfilePage, ['ARTIST']);

function KpiCard({ icon, label, value, tone = 'slate' }: { icon: ReactNode; label: string; value: string | number; tone?: 'slate' | 'emerald' }) {
  const accentClass = tone === 'emerald' ? 'bg-emerald-500' : 'bg-slate-500';
	return (
		<div className="relative group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${accentClass}`} />
			<div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600">
            {icon}
          </div>
          <span>{label}</span>
        </div>
        <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{value}</p>
      </div>
		</div>
	);
}

function Card({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode }) {
	return (
		<section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
			<header className="px-6 py-6 border-b border-slate-50 bg-white flex items-center gap-4">
        <div className="size-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h2>
          {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">{subtitle}</p>}
        </div>
      </header>
			<div className="p-6">
        {children}
      </div>
		</section>
	);
}

function Field({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
	return (
		<div className="space-y-2">
      <div className="flex items-center justify-between px-1">
			  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</label>
			  {helper && <span className="text-[10px] font-bold text-slate-400 italic">{helper}</span>}
      </div>
			{children}
		</div>
	);
}

function StatusPill({ status }: { status: 'ACTIVE' | 'PAUSED' }) {
	const palette = status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-100' : 'bg-slate-100 text-slate-700 border-slate-100';
	const label = status === 'ACTIVE' ? 'CONFIRMADO' : 'PENDIENTE';

	return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${palette}`}>{label}</span>;
}

function StatusLine({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
			<span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{value}</span>
		</div>
	);
}

function formatCurrency(amount: number, currency: string) {
	return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}

function formatShortDate(value: string) {
	return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' });
}
