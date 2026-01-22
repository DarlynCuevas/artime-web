import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase/supabaseClient';

export type ArtistCallSummary = {
	id: string;
	date?: string;
	city?: string;
	venueName?: string;
	offeredMaxPrice?: number;
	created_at?: string;
	response?: 'INTERESTED' | 'NOT_INTERESTED';
};

export function useArtistCalls(params?: { artistId?: string; excludeResponded?: boolean }) {
	const artistId = params?.artistId;
	const excludeResponded = params?.excludeResponded ?? false;
	const [items, setItems] = useState<ArtistCallSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);

		(async () => {
			try {
				const { data, error: supaError } = await supabase
					.from('venue_artist_calls')
					.select('id, date, city, filters, created_at, venue:venue_id ( name, city )')
					.order('created_at', { ascending: false })
					.limit(50);

				if (cancelled) return;
				if (supaError) {
					setError('No se pudieron cargar las convocatorias');
					return;
				}

				let mapped = (data ?? []).map((row: any) => ({
					id: row.id,
					date: row.date,
					city: row.city,
					venueName: row.venue?.name,
					offeredMaxPrice: row.filters?.maxPrice,
					created_at: row.created_at,
				})) as ArtistCallSummary[];

				if (artistId && mapped.length > 0) {
					const callIds = mapped.map((m) => m.id);
					const { data: responses, error: respError } = await supabase
						.from('venue_artist_call_responses')
						.select('call_id, response')
						.eq('artist_id', artistId)
						.in('call_id', callIds);

					if (respError) {
						setError('No se pudieron cargar tus respuestas');
					} else {
						const responseMap = new Map<string, 'INTERESTED' | 'NOT_INTERESTED'>();
						(responses ?? []).forEach((r: any) => {
							responseMap.set(r.call_id, r.response);
						});
						mapped = mapped.map((m) => ({
							...m,
							response: responseMap.get(m.id),
						}));
					}
				}

				if (excludeResponded) {
					mapped = mapped.filter((m) => !m.response);
				}

				setItems(mapped);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [artistId, excludeResponded]);

	return { items, loading, error };
}
