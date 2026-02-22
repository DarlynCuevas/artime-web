import type { ArtistCall } from '@/hooks/calls/useArtistCall';
import { Calendar, MapPin } from 'lucide-react';

type Props = {
	call: ArtistCall;
};

export function CallHeader({ call }: Props) {
	return (
		<header className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
			<div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between gap-4">
				<div className="min-w-0">
					<p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Convocatoria</p>
					<h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
						{call.venueName ?? 'Sala sin nombre'}
					</h1>
				</div>
				<div className="shrink-0 flex items-center gap-2">
					<span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
						<Calendar className="w-3.5 h-3.5 text-slate-500" />
						{call.date
							? new Date(call.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
							: 'Fecha no indicada'}
					</span>
					<span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
						<MapPin className="w-3.5 h-3.5 text-slate-500" />
						{call.city ?? 'Ciudad no indicada'}
					</span>
				</div>
			</div>

			<div className="p-6">
				<div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
					<p className="text-xs font-black uppercase tracking-widest text-amber-700">Encaje</p>
					<p className="text-sm text-slate-700 mt-1">
						La sala busca artistas para esta fecha y tu perfil encaja con lo que est&aacute; buscando.
					</p>
				</div>
			</div>
		</header>
	);
}

export default CallHeader;
