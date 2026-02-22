import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { CallResponseStatus } from '@/hooks/calls/useArtistCall';

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
			<section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
				<div className="flex items-start gap-3">
					<div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${status === 'INTERESTED' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
						{status === 'INTERESTED'
							? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
							: <XCircle className="w-5 h-5 text-rose-500" />
						}
					</div>
					<div>
						<p className="font-black text-slate-900 text-sm">
							{status === 'INTERESTED'
								? 'Has indicado que te interesa'
								: 'Has indicado que no te interesa'}
						</p>
						<p className="text-xs text-slate-500 mt-1">
							Responder no crea una contratación ni bloquea tu agenda.
						</p>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
			<div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
				<div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
					<CheckCircle2 className="w-4 h-4 text-slate-500" />
				</div>
				<div>
					<h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Tu respuesta</h3>
					<p className="text-[10px] text-slate-400 font-bold">No crea contratación</p>
				</div>
			</div>

			<div className="p-6 space-y-4">
				<div className="flex flex-wrap gap-3">
					<button
						onClick={() => handleClick('INTERESTED')}
						disabled={submitting}
						className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-amber text-amber-950 px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
					>
						{confirming === 'INTERESTED' ? 'Confirmar: Me interesa' : 'Me interesa'}
					</button>

					<button
						onClick={() => handleClick('NOT_INTERESTED')}
						disabled={submitting}
						className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
					>
						{confirming === 'NOT_INTERESTED' ? 'Confirmar: No me interesa' : 'No me interesa'}
					</button>
				</div>

				<p className="text-xs text-slate-500">
					Responder no crea una contratación ni bloquea tu agenda.
				</p>
				{error && <p className="text-xs text-rose-600">{error}</p>}
			</div>
		</section>
	);
}

export default CallActions;
