import React from 'react';
import type { ArtistCall } from '@/hooks/calls/useArtistCall';

type Props = {
	call: ArtistCall;
};

export function CallHeader({ call }: Props) {
	return (
		<header
			style={{
				borderBottom: '1px solid #eee',
				paddingBottom: 16,
				marginBottom: 16,
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
				<span style={{
					fontSize: 12,
					fontWeight: 700,
					padding: '4px 8px',
					borderRadius: 999,
					background: '#eef2ff',
					color: '#4338ca',
					textTransform: 'uppercase',
					letterSpacing: 0.3,
				}}>
					Convocatoria
				</span>
				<span style={{ color: '#666', fontSize: 13 }}>{call.date ? new Date(call.date).toLocaleDateString() : 'Fecha no indicada'}</span>
			</div>
			<h1 style={{ margin: 0, fontSize: 22 }}>{call.venueName ?? 'Sala sin nombre'}</h1>
			<p style={{ margin: '6px 0 0', color: '#555' }}>{call.city ?? 'Ciudad no indicada'}</p>
			{call.offeredMaxPrice && (
				<p style={{ margin: '6px 0 0', color: '#0f172a', fontWeight: 700 }}>
					Oferta: €{call.offeredMaxPrice}
				</p>
			)}
		</header>
	);
}

export default CallHeader;
