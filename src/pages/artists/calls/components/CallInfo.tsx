import React from 'react';
import type { ArtistCall } from '@/hooks/calls/useArtistCall';

type Props = {
	call: ArtistCall;
};

export function CallInfo({ call }: Props) {
	return (
		<section
			style={{
				border: '1px solid #eee',
				borderRadius: 8,
				padding: 16,
				marginBottom: 16,
			}}
		>
			<h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Qué busca la sala</h3>
			<p style={{ margin: 0, color: '#333' }}>
				La sala {call.venueName ?? 'sin nombre'} busca artistas para el día {call.date ?? 'sin fecha'}.
			</p>

			{(call.filters?.genre || call.filters?.minPrice || call.filters?.maxPrice) && (
				<div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
					{call.filters?.genre && (
						<span
							style={{
								border: '1px solid #ddd',
								padding: '6px 10px',
								borderRadius: 999,
								fontSize: 12,
								background: '#f8fafc',
							}}
						>
							Género: {call.filters.genre}
						</span>
					)}
					{(call.filters?.minPrice || call.filters?.maxPrice) && (
						<span
							style={{
								border: '1px solid #ddd',
								padding: '6px 10px',
								borderRadius: 999,
								fontSize: 12,
								background: '#f8fafc',
							}}
						>
							Caché: {call.filters?.minPrice ? `€${call.filters.minPrice}` : '—'}
							{call.filters?.maxPrice ? ` - €${call.filters.maxPrice}` : ''}
						</span>
					)}
				</div>
			)}
		</section>
	);
}

export default CallInfo;
