import Link from 'next/link';
import type { ArtistCallSummary } from '@/hooks/calls/useArtistCalls';

type Props = {
	call: ArtistCallSummary;
};

export function CallListItem({ call }: Props) {
	return (
		<li
			style={{
				border: '1px solid #eee',
				borderRadius: 8,
				padding: 16,
				display: 'grid',
				gridTemplateColumns: '2fr 1fr 1fr 1fr',
				gap: 12,
				alignItems: 'center',
			}}
		>
			<div>
				<div style={{ fontWeight: 700 }}>Convocatoria</div>
				<div style={{ color: '#555', fontSize: 13 }}>{call.city ?? 'Ciudad no indicada'}</div>
			</div>
			<div style={{ color: '#333' }}>
				{call.date ? new Date(call.date).toLocaleDateString() : 'Sin fecha'}
			</div>
			<div style={{ color: '#0f172a', fontWeight: 700 }}>
				{call.offeredMaxPrice ? `Oferta: €${call.offeredMaxPrice}` : '—'}
			</div>
			<div style={{ textAlign: 'right' }}>
				<Link href={`/artists/calls/${call.id}`}>Ver detalle</Link>
			</div>
		</li>
	);
}

export default CallListItem;
