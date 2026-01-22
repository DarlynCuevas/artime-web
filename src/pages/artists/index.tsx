import { useEffect, useState } from 'react';
import { withRole } from '@/components/auth/withRole';
import { useMe } from '@/hooks/auth/useMe';
import { useAuth } from '@/hooks/auth/useAuth';
import { updateMyArtistProfile } from '@/services/artists/artists.service';

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
	const [profile, setProfile] = useState<EditableProfile | null>(null);
	const [saving, setSaving] = useState(false);
	const [loadingProfile, setLoadingProfile] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!user?.token) {
			setLoadingProfile(false);
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
		return <p style={{ padding: 24 }}>Cargando perfil…</p>;
	}

	if (role !== 'ARTIST') {
		return <p style={{ padding: 24 }}>Acceso no autorizado</p>;
	}

	if (error) {
		return (
			<p style={{ padding: 24, color: 'red' }}>
				{error}
			</p>
		);
	}

	if (!profile) {
		return <p style={{ padding: 24 }}>No se pudo cargar el perfil.</p>;
	}

	const handleChange = (field: keyof EditableProfile, value: string | number | boolean) => {
		setProfile((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = async () => {
		if (!user?.token || !profile) return;
		setSaving(true);
		setError(null);
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
						genres: Array.isArray(updated.genres)
							? updated.genres.join(', ')
							: prev.genres,
						bio: updated.bio ?? prev.bio,
						format: updated.format ?? prev.format,
						basePrice: updated.basePrice ?? prev.basePrice,
						currency: updated.currency ?? prev.currency,
						isNegotiable:
							updated.isNegotiable !== undefined
								? updated.isNegotiable
								: prev.isNegotiable,
					}
					: prev,
			);
		} catch (err: any) {
			setError(err.message ?? 'Error al guardar');
		} finally {
			setSaving(false);
		}
	};

	return (
		<main
			style={{
				maxWidth: 1100,
				margin: '0 auto',
				padding: '32px 24px',
			}}
		>
			<header style={{ marginBottom: 32 }}>
				<h1 style={{ marginBottom: 8 }}>Mi perfil de artista (privado)</h1>
				<p style={{ color: '#555' }}>
					Edita tu información pública. Esta vista no es visible para venues.
				</p>
			</header>

			<section
				style={{
					display: 'grid',
					gridTemplateColumns: '1.5fr 1fr',
					gap: 24,
					alignItems: 'start',
				}}
			>
				{/* Formulario de edición */}
				<div
					style={{
						border: '1px solid #ddd',
						borderRadius: 8,
						padding: 20,
						background: '#fff',
					}}
				>
					<h2 style={{ fontSize: 16, marginBottom: 16 }}>Información básica</h2>

					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Nombre artístico</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.name}
							onChange={(e) => handleChange('name', e.target.value)}
						/>
					</label>

					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Ciudad</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.city}
							onChange={(e) => handleChange('city', e.target.value)}
						/>
					</label>

					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Géneros (separados por coma)</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.genres}
							onChange={(e) => handleChange('genres', e.target.value)}
						/>
					</label>

					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Formato</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.format}
							onChange={(e) => handleChange('format', e.target.value)}
						/>
					</label>

					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Bio</span>
						<textarea
							style={{ width: '100%', marginTop: 6, padding: 8, minHeight: 96 }}
							value={profile.bio}
							onChange={(e) => handleChange('bio', e.target.value)}
						/>
					</label>

					<h2 style={{ fontSize: 16, margin: '12px 0' }}>Condiciones</h2>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
						<label style={{ display: 'block' }}>
							<span>Fee base</span>
							<input
								type="number"
								style={{ width: '100%', marginTop: 6, padding: 8 }}
								value={profile.basePrice}
								onChange={(e) => handleChange('basePrice', Number(e.target.value))}
							/>
						</label>

						<label style={{ display: 'block' }}>
							<span>Moneda</span>
							<input
								style={{ width: '100%', marginTop: 6, padding: 8 }}
								value={profile.currency}
								onChange={(e) => handleChange('currency', e.target.value)}
							/>
						</label>
					</div>

					<label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
						<input
							type="checkbox"
							checked={profile.isNegotiable}
							onChange={(e) => handleChange('isNegotiable', e.target.checked)}
						/>
						<span>Fee negociable</span>
					</label>

					<h2 style={{ fontSize: 16, margin: '16px 0 12px' }}>Enlaces</h2>
					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Social / EPK</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.socialLink ?? ''}
							onChange={(e) => handleChange('socialLink', e.target.value)}
						/>
					</label>

					<label style={{ display: 'block', marginBottom: 16 }}>
						<span>Tech rider</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.techRider ?? ''}
							onChange={(e) => handleChange('techRider', e.target.value)}
						/>
					</label>

					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						style={{
							padding: '10px 16px',
							background: '#111',
							color: '#fff',
							border: 'none',
							borderRadius: 6,
							cursor: saving ? 'default' : 'pointer',
						}}
					>
						{saving ? 'Guardando…' : 'Guardar cambios'}
					</button>
				</div>

				{/* Preview pública */}
				<aside
					style={{
						border: '1px solid #ddd',
						borderRadius: 8,
						padding: 20,
						background: '#fafafa',
					}}
				>
					<h2 style={{ fontSize: 16, marginBottom: 12 }}>Vista previa pública</h2>
					<p style={{ marginBottom: 6, fontWeight: 600 }}>{profile.name}</p>
					<p style={{ color: '#555', marginBottom: 12 }}>
						{profile.city} {profile.genres ? `· ${profile.genres}` : ''}
					</p>
					<p style={{ marginBottom: 12 }}>{profile.bio}</p>

					<p style={{ fontWeight: 600, marginBottom: 4 }}>Formato</p>
					<p style={{ marginBottom: 12 }}>{profile.format}</p>

					<p style={{ fontWeight: 600, marginBottom: 4 }}>Condiciones base</p>
					<p style={{ marginBottom: 12 }}>
						{profile.basePrice} {profile.currency} ·{' '}
						{profile.isNegotiable ? 'Negociable' : 'No negociable'}
					</p>

					{profile.socialLink && (
						<p style={{ marginBottom: 8 }}>
							Social: <a href={profile.socialLink}>{profile.socialLink}</a>
						</p>
					)}

					{profile.techRider && (
						<p style={{ marginBottom: 8 }}>
							Tech rider: <a href={profile.techRider}>{profile.techRider}</a>
						</p>
					)}

					<p style={{ color: '#777', fontSize: 13, marginTop: 16 }}>
						Esta es la información visible para venues y promoters.
					</p>
				</aside>
			</section>
		</main>
	);
}

export default withRole(ArtistPrivateProfilePage, ['ARTIST']);
