import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { useArtistCall } from '@/hooks/calls/useArtistCall';
import { CallHeader } from './components/CallHeader';
import { CallInfo } from './components/CallInfo';
import { CallActions } from './components/CallActions';
import { useMemo } from 'react';
import { Calendar, ShieldCheck } from 'lucide-react';

export default function ArtistCallDetailPage() {
	const router = useRouter();
	const { id } = router.query as { id?: string };
	const { user } = useAuth();
	const { role, profileId } = useMe();

	// Puedes recibir datos iniciales vía query (por ej. desde notificación)
	const initialCall = useMemo(
		() => ({
			venueName: router.query.venueName as string | undefined,
			city: router.query.city as string | undefined,
			date: router.query.date as string | undefined,
		}),
		[router.query],
	);

	const { call, responseStatus, loading, error, respond } = useArtistCall({
		callId: id,
		artistId: role === 'ARTIST' ? profileId : undefined,
		token: user?.token,
		initialCall,
	});

	if (!id) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Convocatoria no encontrada.</p>
			</div>
		);
	}

	if (!call) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando convocatoria…</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 pb-24">
			<main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
				<CallHeader call={call} />
				<CallInfo call={call} />

				<section className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
					<div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
						<div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
							<Calendar className="w-4 h-4 text-slate-500" />
						</div>
						<div>
							<h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Tu disponibilidad</h3>
							<p className="text-[10px] text-slate-400 font-bold">Informativo</p>
						</div>
					</div>
					<div className="p-6 space-y-2">
						<p className="text-sm text-slate-600">
							No tienes compromisos bloqueantes registrados para esta fecha.
						</p>
						<p className="text-xs text-slate-500">
							Esta sección es informativa y no bloquea tu agenda.
						</p>
					</div>
				</section>

				<CallActions status={responseStatus} onRespond={respond} />

				<div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-start gap-3 shadow-sm">
					<div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
						<ShieldCheck className="w-4 h-4 text-emerald-500" />
					</div>
					<div>
						<p className="text-xs font-black uppercase tracking-widest text-slate-700">Regla de plataforma</p>
						<p className="text-xs text-slate-500 mt-1">
							Responder a una convocatoria no crea una contratación ni bloquea tu agenda.
						</p>
					</div>
				</div>

				{loading && <p className="text-xs font-semibold text-slate-500">Procesando…</p>}
				{error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
			</main>
		</div>
	);
}
