import React, { useState } from 'react';
import type { CallResponseStatus } from '../hooks/useArtistCall';

type Props = {
	status: CallResponseStatus;
	onRespond: (response: 'INTERESTED' | 'NOT_INTERESTED') => Promise<void>;
};

export function CallActions({ status, onRespond }: Props) {
	const [confirming, setConfirming] = useState<'INTERESTED' | 'NOT_INTERESTED' | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleClick = async (response: 'INTERESTED' | 'NOT_INTERESTED') => {
		if (submitting) return;
		if (confirming !== response) {
			setConfirming(response);
			return;
		}
		try {
			setSubmitting(true);
			setError(null);
			await onRespond(response);
		} catch (err: any) {
			setError(err?.message || 'No se pudo registrar la respuesta');
		} finally {
			setSubmitting(false);
			setConfirming(null);
		}
	};

	if (status === 'INTERESTED' || status === 'NOT_INTERESTED') {
		return (
			<section
				style={{
					border: '1px solid #e2e8f0',
					padding: 16,
					borderRadius: 8,
					background: '#f8fafc',
					marginBottom: 16,
				}}
			>
				<p style={{ margin: 0, fontWeight: 600 }}>
					{status === 'INTERESTED'
						? 'Has indicado que te interesa'
						: 'Has indicado que no te interesa'}
				</p>
				<p style={{ margin: '6px 0 0', color: '#555', fontSize: 13 }}>
					Responder no crea una contratación ni bloquea tu agenda.
				</p>
			</section>
		);
	}

	return (
		<section
			style={{
				display: 'flex',
				gap: 12,
				flexWrap: 'wrap',
				marginBottom: 16,
			}}
		>
			<button
				onClick={() => handleClick('INTERESTED')}
				disabled={submitting}
				style={{
					padding: '10px 14px',
					borderRadius: 8,
					border: '1px solid #0f172a',
					background: '#0f172a',
					color: '#fff',
					cursor: submitting ? 'not-allowed' : 'pointer',
					minWidth: 160,
				}}
			>
				{confirming === 'INTERESTED' ? 'Confirmar: Me interesa' : 'Me interesa'}
			</button>

			<button
				onClick={() => handleClick('NOT_INTERESTED')}
				disabled={submitting}
				style={{
					padding: '10px 14px',
					borderRadius: 8,
					border: '1px solid #ddd',
					background: '#fff',
					color: '#0f172a',
					cursor: submitting ? 'not-allowed' : 'pointer',
					minWidth: 160,
				}}
			>
				{confirming === 'NOT_INTERESTED' ? 'Confirmar: No me interesa' : 'No me interesa'}
			</button>

			<div style={{ flexBasis: '100%' }} />
			<p style={{ margin: 0, color: '#555', fontSize: 13 }}>
				Responder no crea una contratación ni bloquea tu agenda.
			</p>
			{error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
		</section>
	);
}
