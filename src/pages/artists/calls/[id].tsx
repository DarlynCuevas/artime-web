import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { useArtistCall } from './hooks/useArtistCall';
import { CallHeader } from './components/CallHeader';
import { CallInfo } from './components/CallInfo';
import { CallActions } from './components/CallActions';
import { useMemo } from 'react';

export default function ArtistCallDetailPage() {
	const router = useRouter();
	const { id } = router.query as { id?: string };
	const { user } = useAuth();
	const { role, profileId } = useMe();

	// Puedes recibir datos iniciales vía query (por ej. desde notificación)
	const initialCall = useMemo(
		() => ({
			venueName: router.query.venueName as string | undefined,
			city: router.query.city as string | undefined,
			date: router.query.date as string | undefined,
			offeredMaxPrice: router.query.price ? Number(router.query.price) : undefined,
		}),
		[router.query],
	);

	const { call, responseStatus, loading, error, respond } = useArtistCall({
		callId: id,
		artistId: role === 'ARTIST' ? profileId : undefined,
		token: user?.token,
		initialCall,
	});

	if (!id) {
		return <p style={{ padding: 24 }}>Convocatoria no encontrada.</p>;
	}

	if (!call) {
		return <p style={{ padding: 24 }}>Cargando convocatoria…</p>;
	}

	return (
		<main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 16 }}>
			<CallHeader call={call} />
			<CallInfo call={call} />

			<section
				style={{
					border: '1px solid #eee',
					borderRadius: 8,
					padding: 16,
					marginBottom: 8,
				}}
			>
				<h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Tu disponibilidad</h3>
				<p style={{ margin: 0, color: '#333' }}>
					No tienes compromisos bloqueantes registrados para esta fecha.
				</p>
				<p style={{ margin: '4px 0 0', color: '#777', fontSize: 13 }}>
					Esta sección es informativa y no bloquea tu agenda.
				</p>
			</section>

			<CallActions status={responseStatus} onRespond={respond} />

			<footer style={{ color: '#555', fontSize: 13 }}>
				Responder a una convocatoria no crea una contratación ni bloquea tu agenda.
			</footer>

			{loading && <p style={{ color: '#666' }}>Procesando…</p>}
			{error && <p style={{ color: 'red' }}>{error}</p>}
		</main>
	);
}
