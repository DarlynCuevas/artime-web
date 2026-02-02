import { useEffect, useState } from 'react';

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
};

function VenueProfilePage() {
	const { role, loading: meLoading } = useMe();
	const { user } = useAuth();

	const [profile, setProfile] = useState<EditableVenueProfile | null>(null);
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
				});
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoadingProfile(false));
	}, [user?.token]);

	if (meLoading || loadingProfile) {
		return <p style={{ padding: 24 }}>Cargando perfil…</p>;
	}

	if (role !== 'VENUE') {
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

	const handleChange = (field: keyof EditableVenueProfile, value: string | number | null) => {
		setProfile((prev) => (prev ? { ...prev, [field]: value as any } : prev));
	};

	const handleSave = async () => {
		if (!user?.token || !profile) return;
		setSaving(true);
		setError(null);
		try {
			const payload = {
				name: profile.name,
				city: profile.city,
				address: profile.address,
				capacity: profile.capacity ?? undefined,
				description: profile.description,
				genres: profile.genres
					.split(',')
					.map((g) => g.trim())
					.filter(Boolean),
				amenities: profile.amenities
					.split(',')
					.map((a) => a.trim())
					.filter(Boolean),
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
				<h1 style={{ marginBottom: 8 }}>Mi perfil de venue</h1>
				<p style={{ color: '#555' }}>
					Edita la información pública de tu sala. Esta vista es privada para tu equipo.
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
						<span>Nombre de la sala</span>
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
						<span>Dirección</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.address}
							onChange={(e) => handleChange('address', e.target.value)}
						/>
					</label>

					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Capacidad</span>
						<input
							type="number"
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.capacity ?? ''}
							onChange={(e) => handleChange('capacity', e.target.value ? Number(e.target.value) : null)}
						/>
					</label>

					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Descripción</span>
						<textarea
							style={{ width: '100%', marginTop: 6, padding: 8, minHeight: 96 }}
							value={profile.description}
							onChange={(e) => handleChange('description', e.target.value)}
						/>
					</label>

					<h2 style={{ fontSize: 16, margin: '12px 0' }}>Preferencias</h2>
					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Géneros (separados por coma)</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.genres}
							onChange={(e) => handleChange('genres', e.target.value)}
						/>
					</label>

					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Amenidades / equipo (separados por coma)</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.amenities}
							onChange={(e) => handleChange('amenities', e.target.value)}
						/>
					</label>

					<h2 style={{ fontSize: 16, margin: '12px 0' }}>Contacto</h2>
					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Website</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.website}
							onChange={(e) => handleChange('website', e.target.value)}
						/>
					</label>

					<label style={{ display: 'block', marginBottom: 12 }}>
						<span>Email de contacto</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.contactEmail}
							onChange={(e) => handleChange('contactEmail', e.target.value)}
						/>
					</label>

					<label style={{ display: 'block', marginBottom: 16 }}>
						<span>Teléfono</span>
						<input
							style={{ width: '100%', marginTop: 6, padding: 8 }}
							value={profile.contactPhone}
							onChange={(e) => handleChange('contactPhone', e.target.value)}
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
					<p style={{ marginBottom: 12 }}>{profile.description}</p>

					<p style={{ fontWeight: 600, marginBottom: 4 }}>Dirección</p>
					<p style={{ marginBottom: 12 }}>{profile.address || '—'}</p>

					<p style={{ fontWeight: 600, marginBottom: 4 }}>Capacidad</p>
					<p style={{ marginBottom: 12 }}>{profile.capacity ?? '—'}</p>

					<p style={{ fontWeight: 600, marginBottom: 4 }}>Amenidades</p>
					<p style={{ marginBottom: 12 }}>{profile.amenities || '—'}</p>

					{profile.website && (
						<p style={{ marginBottom: 8 }}>
							Website: <a href={profile.website}>{profile.website}</a>
						</p>
					)}

					{profile.contactEmail && (
						<p style={{ marginBottom: 4 }}>Email: {profile.contactEmail}</p>
					)}

					{profile.contactPhone && (
						<p style={{ marginBottom: 4 }}>Teléfono: {profile.contactPhone}</p>
					)}

					<p style={{ color: '#777', fontSize: 13, marginTop: 16 }}>
						Esta es la información visible para artistas y managers.
					</p>
				</aside>
			</section>
		</main>
	);
}

export default withRole(VenueProfilePage, ['VENUE']);
