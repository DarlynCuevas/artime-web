import { useArtistCalls } from './hooks/useArtistCalls';
import { CallListItem } from './components/CallListItem';
import { useMe } from '@/hooks/auth/useMe';

export default function ArtistCallsIndexPage() {
	const { role, profileId } = useMe();
	const { items, loading, error } = useArtistCalls({
		artistId: role === 'ARTIST' ? profileId : undefined,
		excludeResponded: true,
	});

	return (
		<main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
			<header style={{ marginBottom: 24 }}>
				<h1>Convocatorias</h1>
				<p style={{ color: '#555' }}>Invitaciones que las salas envían para fechas específicas.</p>
			</header>

			{loading && <p>Cargando convocatorias…</p>}
			{error && <p style={{ color: 'red' }}>{error}</p>}

			{!loading && !error && items.length === 0 && <p style={{ color: '#666' }}>No tienes convocatorias pendientes.</p>}

			{!loading && !error && items.length > 0 && (
				<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
					{items.map((call) => (
						<CallListItem key={call.id} call={call} />
					))}
				</ul>
			)}
		</main>
	);
}
