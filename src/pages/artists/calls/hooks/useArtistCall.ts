import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/services/supabase/supabaseClient';

export type ArtistCall = {
	id: string;
	venueName?: string;
	venueId?: string;
	city?: string;
	date?: string;
	offeredMaxPrice?: number;
	filters?: {
		genre?: string;
		minPrice?: number;
		maxPrice?: number;
	};
};

export type CallResponseStatus = 'UNANSWERED' | 'INTERESTED' | 'NOT_INTERESTED';

type Params = {
	callId?: string;
	artistId?: string;
	token?: string;
	initialCall?: Partial<ArtistCall>;
};

export function useArtistCall({ callId, artistId, token, initialCall }: Params) {
	const [call, setCall] = useState<ArtistCall | null>(() =>
		callId
			? {
					id: callId,
					...initialCall,
				}
			: null,
	);
		useEffect(() => {
			if (callId) {
				setCall({
					id: callId,
					...initialCall,
				});
			}
		}, [callId, initialCall]);

	const [responseStatus, setResponseStatus] = useState<CallResponseStatus>('UNANSWERED');
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Busca si ya hay respuesta del artista en esta convocatoria (Supabase RLS debe permitirlo)
	useEffect(() => {
		if (!callId) return;
		let cancelled = false;

		(async () => {
			try {
				const { data, error: supaError } = await supabase
					.from('venue_artist_calls')
					.select('id, date, city, filters, venue:venue_id ( id, name, city )')
					.eq('id', callId)
					.single();

				if (cancelled) return;
				if (supaError && supaError.code !== 'PGRST116') {
					setError('No se pudo cargar la convocatoria');
					return;
				}

				if (data) {
					setCall({
						id: data.id,
						date: data.date,
						city: data.city,
						filters: data.filters ?? {},
						venueName: data.venue?.name,
						venueId: data.venue?.id,
						offeredMaxPrice: data.filters?.maxPrice,
					});
				}
			} catch (err) {
				if (!cancelled) setError('No se pudo cargar la convocatoria');
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [callId]);

	useEffect(() => {
		if (!callId || !artistId) return;
		let cancelled = false;
		setResponseStatus('UNANSWERED');
		setLoading(true);
		setError(null);
		(async () => {
			try {
				const { data, error: supaError } = await supabase
					.from('venue_artist_call_responses')
					.select('response')
					.eq('call_id', callId)
					.eq('artist_id', artistId)
					.single();

				if (cancelled) return;
				if (supaError && supaError.code !== 'PGRST116') {
					// ignore not found; code PGRST116 is single() no rows
					setError('No se pudo cargar tu respuesta');
				}
				if (data?.response === 'INTERESTED') {
					setResponseStatus('INTERESTED');
				} else if (data?.response === 'NOT_INTERESTED') {
					setResponseStatus('NOT_INTERESTED');
				} else {
					setResponseStatus('UNANSWERED');
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [callId, artistId]);

	const respond = async (response: 'INTERESTED' | 'NOT_INTERESTED') => {
		if (!token || !callId) {
			throw new Error('Falta sesión o convocatoria');
		}
		setError(null);
		setLoading(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_BASE_URL}/artist/artist-calls/${callId}/respond`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ response }),
				},
			);

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'No se pudo registrar la respuesta');
			}

			setResponseStatus(response === 'INTERESTED' ? 'INTERESTED' : 'NOT_INTERESTED');
		} catch (err: any) {
			setError(err?.message || 'Error al responder');
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const derived = useMemo(
		() => ({
			call,
			responseStatus,
			loading,
			error,
			respond,
		}),
		[call, responseStatus, loading, error],
	);

	return derived;
}
