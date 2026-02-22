import React from 'react';
import { Filter, Music2 } from 'lucide-react';
import type { ArtistCall } from '@/hooks/calls/useArtistCall';

type Props = {
	call: ArtistCall;
};

export function CallInfo({ call }: Props) {
	return (
		<section className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
			<div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
				<div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
					<Filter className="w-4 h-4 text-slate-500" />
				</div>
				<div>
					<h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Qué busca la sala</h3>
					<p className="text-[10px] text-slate-400 font-bold">Convocatoria abierta</p>
				</div>
			</div>

			<div className="p-6 space-y-4">
				<p className="text-sm text-slate-600">
					La sala <span className="font-semibold text-slate-900">{call.venueName ?? 'sin nombre'}</span> busca artistas para el día{' '}
					<span className="font-semibold text-slate-900">{call.date ?? 'sin fecha'}</span>. Esta convocatoria es para encontrar perfiles compatibles.
				</p>

				{call.filters?.genre ? (
					<div className="flex flex-wrap gap-2">
						<span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
							<Music2 className="w-3.5 h-3.5 text-slate-500" />
							Género: {call.filters.genre}
						</span>
					</div>
				) : (
					<div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
						No hay filtros específicos definidos para esta convocatoria.
					</div>
				)}
			</div>
		</section>
	);
}

export default CallInfo;
