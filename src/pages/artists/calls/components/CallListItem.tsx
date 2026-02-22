import Link from 'next/link';
import type { ArtistCallSummary } from '@/hooks/calls/useArtistCalls';
import { ArrowRight, Calendar, MapPin } from 'lucide-react';

type Props = {
	call: ArtistCallSummary;
};

export function CallListItem({ call }: Props) {
	return (
		<li className="bg-white border border-slate-200 rounded-3xl px-6 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
			<div className="flex flex-col sm:flex-row sm:items-center gap-4">
				<div className="flex-1 min-w-0">
					<p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Convocatoria</p>
					<p className="font-black text-slate-900 truncate">{call.venueName ?? 'Sala sin nombre'}</p>
					<div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
						<span className="inline-flex items-center gap-1">
							<MapPin className="w-3 h-3" />
							{call.city ?? 'Ciudad no indicada'}
						</span>
						<span className="inline-flex items-center gap-1">
							<Calendar className="w-3 h-3" />
							{call.date ? new Date(call.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}
						</span>
					</div>
				</div>

				<div className="shrink-0 flex items-center gap-3">
					<span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${call.response === 'INTERESTED'
						? 'bg-emerald-50 border-emerald-200 text-emerald-700'
						: call.response === 'NOT_INTERESTED'
							? 'bg-rose-50 border-rose-200 text-rose-700'
							: 'bg-slate-50 border-slate-200 text-slate-600'
						}`}>
						{call.response === 'INTERESTED'
							? 'Te interesa'
							: call.response === 'NOT_INTERESTED'
								? 'No te interesa'
								: 'Sin responder'}
					</span>

					<Link
						href={`/artists/calls/${call.id}`}
						className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-700 hover:text-amber-700 hover:border-amber-200 hover:bg-amber-50/40 transition-all"
					>
						Ver detalle <ArrowRight className="w-3.5 h-3.5" />
					</Link>
				</div>
			</div>
		</li>
	);
}

export default CallListItem;
