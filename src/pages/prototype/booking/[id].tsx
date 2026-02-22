import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    CreditCard,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronRight,
    Download,
    Flag,
    Loader2,
    Music2,
    AlertTriangle,
    Ban,
} from 'lucide-react';
import { GlassCard } from '../../../components/profile/GlassCard';

// ─── Tipos mock ───────────────────────────────────────────────────────────────
type BookingStatus =
    | 'PENDING'
    | 'NEGOTIATING'
    | 'FINAL_OFFER_SENT'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'CONTRACT_SIGNED'
    | 'PAID_PARTIAL'
    | 'PAID_FULL'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'CANCELLED_PENDING_REVIEW';

type NegotiationRole = 'VENUE' | 'ARTIST' | 'MANAGER' | 'PROMOTER';

interface TimelineEvent {
    id: string;
    role: NegotiationRole;
    amount?: number;
    note?: string;
    date: string;
    isFinal?: boolean;
}

// ─── Datos mock ───────────────────────────────────────────────────────────────
const MOCK_STATUS: BookingStatus = 'CONTRACT_SIGNED'; // ← cambiar para ver estados

const mockBooking = {
    id: 'bk_001',
    status: MOCK_STATUS,
    artistName: 'Elena de la Cruz',
    artistType: 'Banda Principal',
    venueName: 'Teatro Lara',
    venueCity: 'Madrid',
    eventName: null, // null = booking directo sala; string = desde evento
    eventDate: '2026-08-22',
    totalAmount: 3500,
    currency: 'EUR',
    hasTurn: true,
    paymentPercent: 0,
    paymentPaid: 0,
    contractStatus: 'DRAFT' as 'DRAFT' | 'SIGNED' | null,
    lastActivity: 'hace 2 horas',
};

const mockTimeline: TimelineEvent[] = [
    { id: '1', role: 'VENUE', amount: 2800, note: 'Propuesta inicial para el cierre del festival.', date: '10 feb' },
    { id: '2', role: 'ARTIST', amount: 3200, note: 'Contraoferta. Incluye backline propio.', date: '11 feb' },
    { id: '3', role: 'VENUE', amount: 3500, note: '¡Trato! Esta es nuestra oferta final.', date: '12 feb', isFinal: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}

// ─── BookingStatusBadge ───────────────────────────────────────────────────────
function BookingStatusBadge({ status }: { status: BookingStatus }) {
    // Diseñado para fondo OSCURO (hero)
    const config: Record<BookingStatus, { label: string; dot: string; border: string; text: string; pulse?: boolean }> = {
        PENDING: { label: 'Pendiente', dot: 'bg-amber-400', border: 'border-amber-400/40', text: 'text-amber-300', pulse: true },
        NEGOTIATING: { label: 'Negociando', dot: 'bg-amber-400', border: 'border-amber-400/40', text: 'text-amber-300', pulse: true },
        FINAL_OFFER_SENT: { label: 'Oferta Final', dot: 'bg-orange-400', border: 'border-orange-400/40', text: 'text-orange-300', pulse: true },
        ACCEPTED: { label: 'Aceptado', dot: 'bg-emerald-400', border: 'border-emerald-400/40', text: 'text-emerald-300' },
        REJECTED: { label: 'Rechazado', dot: 'bg-red-400', border: 'border-red-400/40', text: 'text-red-300' },
        CONTRACT_SIGNED: { label: 'Contrato Firmado', dot: 'bg-blue-400', border: 'border-blue-400/40', text: 'text-blue-300' },
        PAID_PARTIAL: { label: 'Pago Parcial', dot: 'bg-sky-400', border: 'border-sky-400/40', text: 'text-sky-300' },
        PAID_FULL: { label: 'Pagado', dot: 'bg-green-400', border: 'border-green-400/40', text: 'text-green-300' },
        COMPLETED: { label: 'Completado', dot: 'bg-green-400', border: 'border-green-400/40', text: 'text-green-300' },
        CANCELLED: { label: 'Cancelado', dot: 'bg-slate-400', border: 'border-slate-400/40', text: 'text-slate-300' },
        CANCELLED_PENDING_REVIEW: { label: 'Cancelación Revisión', dot: 'bg-slate-400', border: 'border-slate-400/40', text: 'text-slate-300' },
    };
    const { label, dot, border, text, pulse } = config[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white/10 backdrop-blur-sm text-xs font-bold uppercase tracking-wider ${border} ${text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot} ${pulse ? 'animate-pulse' : ''}`} />
            {label}
        </span>
    );
}

// ─── KPI Pill ─────────────────────────────────────────────────────────────────
function KpiPill({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className={`flex flex-col items-center justify-center px-4 py-3 rounded-2xl border transition-all ${accent
            ? 'bg-amber-400/20 border-amber-400/50'
            : 'bg-white/8 border-white/15'
            }`}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{label}</span>
            <span className={`text-sm font-extrabold tabular-nums ${accent ? 'text-amber-300' : 'text-white'}`}>{value}</span>
        </div>
    );
}

// ─── Timeline Bubble ──────────────────────────────────────────────────────────
function TimelineBubble({ event, isOwn }: { event: TimelineEvent; isOwn: boolean }) {
    const roleLabel: Record<NegotiationRole, string> = {
        VENUE: 'Sala', ARTIST: 'Artista', MANAGER: 'Manager', PROMOTER: 'Promotor',
    };
    const roleInitial: Record<NegotiationRole, string> = {
        VENUE: 'S', ARTIST: 'A', MANAGER: 'M', PROMOTER: 'P',
    };

    return (
        <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar rol */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-sm ${isOwn ? 'bg-amber-500 text-amber-950' : 'bg-slate-200 text-slate-600'}`}>
                {roleInitial[event.role]}
            </div>

            {/* Burbuja */}
            <div className={`max-w-[75%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {/* Cabecera */}
                <div className={`flex items-center gap-2 text-xs text-slate-500 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="font-semibold">{roleLabel[event.role]}</span>
                    <span>·</span>
                    <span>{event.date}</span>
                    {event.isFinal && (
                        <span className="flex items-center gap-1 text-orange-600 font-bold">
                            <Flag className="w-3 h-3" /> Oferta final
                        </span>
                    )}
                </div>

                {/* Burbuja principal */}
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${isOwn
                    ? 'bg-transparent border border-amber-400 text-slate-800 rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                    }`}>
                    {event.amount !== undefined && (
                        <p className={`text-2xl font-black tabular-nums tracking-tighter mb-1 text-slate-900`}>
                            {formatCurrency(event.amount, 'EUR')}
                        </p>
                    )}
                    {event.note && (
                        <p className={`text-sm leading-relaxed text-slate-600`}>
                            {event.note}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Panel de Acción ──────────────────────────────────────────────────────────
// Reproduce fielmente la lógica de NegotiationPanel.tsx + flujo de pago de [id].tsx
function ActionPanel({
    status,
    hasTurn,
    viewerRole,
}: {
    status: BookingStatus;
    hasTurn: boolean;
    viewerRole: NegotiationRole;
}) {
    const [fee, setFee] = useState<number | ''>('');
    const [note, setNote] = useState('');
    const [isFinalOffer, setIsFinalOffer] = useState(false);

    const isArtistSide = viewerRole === 'ARTIST' || viewerRole === 'MANAGER';
    const isVenueSide = viewerRole === 'VENUE' || viewerRole === 'PROMOTER';
    const isClosed = ['ACCEPTED', 'PAID_PARTIAL', 'PAID_FULL', 'COMPLETED', 'CANCELLED', 'CANCELLED_PENDING_REVIEW', 'REJECTED'].includes(status);

    // ── Condiciones idénticas a NegotiationPanel.tsx ──
    const canWrite =
        ['PENDING', 'NEGOTIATING'].includes(status) &&
        hasTurn &&
        !(status === 'PENDING' && isVenueSide); // VENUE no puede escribir en PENDING (es el iniciador)

    const canMarkAsFinalOffer =
        hasTurn &&
        (
            (isArtistSide && ['PENDING', 'NEGOTIATING'].includes(status)) ||
            (isVenueSide && status === 'NEGOTIATING')
        );

    const canAcceptOrReject =
        ['PENDING', 'NEGOTIATING', 'FINAL_OFFER_SENT'].includes(status) &&
        hasTurn &&
        !(status === 'PENDING' && isVenueSide);

    // Cancelar: cuando no puede actuar (su turno), no está cerrado y no es ACCEPTED/CONTRACT_SIGNED
    const showCancelOnly =
        !canWrite && !canAcceptOrReject &&
        !isClosed &&
        !['ACCEPTED', 'CONTRACT_SIGNED'].includes(status);

    // Pago: VENUE o PROMOTER, contrato firmado, no pagado
    const showPayment =
        status === 'CONTRACT_SIGNED' && isVenueSide;

    // Estados finales cerrados
    if (isClosed) {
        const closedMap: Partial<Record<BookingStatus, { icon: React.ReactNode; msg: string; sub: string }>> = {
            ACCEPTED: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, msg: 'Contratación aceptada', sub: 'Pendiente de firma de contrato por ambas partes.' },
            PAID_FULL: { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, msg: '¡Todo completado!', sub: 'El pago ha sido procesado. ¡Nos vemos en el escenario!' },
            COMPLETED: { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, msg: '¡Completado!', sub: 'La contratación ha finalizado con éxito.' },
            REJECTED: { icon: <XCircle className="w-5 h-5 text-red-500" />, msg: 'Propuesta rechazada', sub: 'La otra parte rechazó la propuesta. El proceso ha finalizado.' },
            CANCELLED: { icon: <Ban className="w-5 h-5 text-slate-500" />, msg: 'Booking cancelado', sub: 'Esta contratación ha sido cancelada.' },
            CANCELLED_PENDING_REVIEW: { icon: <Ban className="w-5 h-5 text-slate-500" />, msg: 'Cancelación en revisión', sub: 'La cancelación está siendo revisada por el equipo.' },
            PAID_PARTIAL: { icon: <CreditCard className="w-5 h-5 text-sky-500" />, msg: 'Pago parcial recibido', sub: 'Pendiente de completar el importe total.' },
        };
        const c = closedMap[status];
        if (c) return (
            <div className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">{c.icon}</div>
                <div>
                    <p className="font-bold text-slate-900 text-sm">{c.msg}</p>
                    <p className="text-xs text-slate-500 mt-1">{c.sub}</p>
                </div>
            </div>
        );
    }

    // CONTRACT_SIGNED — informativo + pago si aplica
    if (status === 'CONTRACT_SIGNED') {
        return (
            <div className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">Contrato firmado</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {showPayment
                                ? 'Ya puedes proceder con el pago para confirmar la contratación.'
                                : 'Pendiente de que la sala procese el pago.'}
                        </p>
                    </div>
                </div>
                {showPayment && (
                    <button className="h-11 px-6 rounded-xl border border-amber-400 text-amber-700 hover:bg-amber-50 font-bold text-sm transition-all duration-200 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Proceder al pago
                    </button>
                )}
            </div>
        );
    }

    // ACCEPTED — solo informativo (no pagado)
    if (status === 'ACCEPTED') {
        return (
            <div className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                    <p className="font-bold text-slate-900 text-sm">Contratación aceptada</p>
                    <p className="text-xs text-slate-500 mt-1">Pendiente de firma de contrato por ambas partes.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 space-y-5">

            {/* ── Esperando al contrario ──────────────────────────────── */}
            {!canWrite && !canAcceptOrReject && status === 'FINAL_OFFER_SENT' && !hasTurn && (
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                        <Flag className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">Oferta final enviada</p>
                        <p className="text-xs text-slate-500 mt-1">La otra parte debe aceptar o rechazar tu oferta final.</p>
                    </div>
                </div>
            )}

            {!canWrite && !canAcceptOrReject && ['PENDING', 'NEGOTIATING'].includes(status) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    La negociación está pendiente de acción de la otra parte.
                </div>
            )}

            {/* ── Formulario de propuesta ─────────────────────────────── */}
            {canWrite && (
                <div className="space-y-3">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Mensaje opcional para la propuesta…"
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 resize-none focus:border-slate-400 focus:outline-none placeholder:text-slate-400"
                    />
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 block">Importe (€)</label>
                        <input
                            type="number"
                            placeholder="0,00"
                            value={fee}
                            onChange={(e) => setFee(e.target.value ? Number(e.target.value) : '')}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                        />
                    </div>

                    {canMarkAsFinalOffer && (
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isFinalOffer}
                                    onChange={(e) => setIsFinalOffer(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                                />
                                <span>Marcar como <span className="font-semibold text-orange-600">oferta final</span></span>
                            </label>
                        </div>
                    )}

                    <div>
                        <button
                            disabled={!fee || Number(fee) <= 0}
                            className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all duration-200 disabled:opacity-40"
                        >
                            Enviar propuesta
                        </button>
                    </div>
                </div>
            )}

            {/* ── Aceptar / Rechazar ──────────────────────────────────── */}
            {canAcceptOrReject && (
                <div className="space-y-3">
                    {status === 'FINAL_OFFER_SENT' && (
                        <div className="flex items-start gap-3 rounded-xl bg-orange-50 border border-orange-100 p-3">
                            <Flag className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-orange-700 font-medium">
                                Oferta final sobre la mesa. Debes aceptar o rechazar — no se permiten contraofertas.
                            </p>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button className="flex-1 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Aceptar
                        </button>
                        <button className="flex-1 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2">
                            <XCircle className="w-4 h-4 text-red-400" /> Rechazar
                        </button>
                    </div>
                </div>
            )}

            {/* ── Cancelar (cuando es turno del contrario) ────────────── */}
            {showCancelOnly && (
                <button className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all duration-200">
                    Cancelar booking
                </button>
            )}
        </div>
    );
}


// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function BookingPrototypePage() {
    const [viewerRole] = useState<NegotiationRole>('VENUE'); // simula quién ve la página
    const booking = mockBooking;

    const isOwn = (role: NegotiationRole) => role === viewerRole;

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-amber-100 selection:text-amber-900">
            <Head>
                <title>Prototipo | Booking — {booking.artistName}</title>
            </Head>

            {/* ── TOP NAVIGATION ────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
                <Link
                    href="/artists/bookings"
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a bookings
                </Link>
            </div>

            {/* ── BOOKING HERO ─────────────────────────────────────────── */}
            <div className="relative w-full overflow-hidden bg-fintech-dark">
                {/* Glow de fondo */}
                <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-pulse" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-15" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-8">

                    {/* Artista → Sala / Estado */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                        <div>
                            {/* Nombre del artista */}
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Music2 className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/50 font-semibold uppercase tracking-widest">Contratación</p>
                                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                        {booking.artistName}
                                    </h1>
                                </div>
                            </div>

                            {/* Sala + ciudad + fecha */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/60 text-sm ml-[52px]">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {booking.venueName} · {booking.venueCity}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(booking.eventDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        {/* Status badge + última actividad */}
                        <div className="flex flex-col items-start sm:items-end gap-2 ml-[52px] sm:ml-0">
                            <BookingStatusBadge status={booking.status as BookingStatus} />
                            <span className="text-xs text-white/40 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {booking.lastActivity}
                            </span>
                        </div>
                    </div>

                    {/* KPI Pills */}
                    <div className="grid grid-cols-3 gap-3">
                        <KpiPill label="Importe" value={formatCurrency(booking.totalAmount, booking.currency)} />
                        <KpiPill
                            label="Pago"
                            value={booking.paymentPercent > 0 ? `${booking.paymentPercent}%` : '—'}
                        />
                        <KpiPill label="Turno" value={booking.hasTurn ? 'Tu turno' : 'En espera'} accent={booking.hasTurn} />
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Columna Principal ──────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Panel de Acción */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <h2 className="font-bold text-slate-900 text-sm">Acción requerida</h2>
                            </div>
                            <ActionPanel status={booking.status as BookingStatus} hasTurn={booking.hasTurn} viewerRole={viewerRole} />
                        </div>

                        {/* Timeline de Negociación */}
                        <GlassCard title="Historial de negociación" icon={<CreditCard className="w-4 h-4" />}>
                            <div className="space-y-5">
                                {mockTimeline.map((event) => (
                                    <TimelineBubble
                                        key={event.id}
                                        event={event}
                                        isOwn={isOwn(event.role)}
                                    />
                                ))}
                            </div>
                        </GlassCard>

                        {/* Condiciones */}
                        <GlassCard
                            title="Condiciones acordadas"
                            icon={<CheckCircle2 className="w-4 h-4" />}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Importes */}
                                <div className="space-y-3">
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">Propuesta inicial</p>
                                        <p className="text-xl font-black text-slate-400 line-through tabular-nums">
                                            {formatCurrency(mockTimeline[0].amount!, 'EUR')}
                                        </p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                        <p className="text-xs text-amber-600 font-semibold uppercase tracking-widest mb-1">Oferta actual</p>
                                        <p className="text-2xl font-black text-amber-900 tabular-nums">
                                            {formatCurrency(booking.totalAmount, booking.currency)}
                                        </p>
                                    </div>
                                </div>

                                {/* Incluido / Excluido */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Incluido</p>
                                        <ul className="space-y-1.5">
                                            {['Alojamiento', 'Backline básico', 'Cena para el artista'].map((item) => (
                                                <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">No incluido</p>
                                        <ul className="space-y-1.5">
                                            {['Transporte', 'Sonido PA'].map((item) => (
                                                <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                                                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Sidebar mobile: Contrato + Evento + Pago */}
                        <div className="block lg:hidden space-y-6">
                            <SidebarCards booking={booking} />
                        </div>
                    </div>

                    {/* ── Sidebar (desktop only) ─────────────────────────── */}
                    <aside className="hidden lg:block space-y-6">
                        <SidebarCards booking={booking} />
                    </aside>

                </div>
            </main>
        </div>
    );
}

// ─── Sidebar Cards (reutilizadas en desktop y móvil) ─────────────────────────
function SidebarCards({ booking }: { booking: typeof mockBooking }) {
    return (
        <>
            {/* Contrato */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-amber" />
                    Contrato
                </h3>
                <div className="space-y-3">
                    <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl font-medium ${booking.contractStatus === 'SIGNED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${booking.contractStatus === 'SIGNED' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                        {booking.contractStatus === 'SIGNED' ? 'Firmado por ambas partes' : 'Borrador — Pendiente de firma'}
                    </div>

                    {booking.contractStatus === 'DRAFT' && (
                        <button className="w-full h-10 rounded-xl border border-amber-400 text-amber-700 hover:bg-amber-50 font-bold text-sm transition-all duration-200">
                            Firmar contrato
                        </button>
                    )}
                    {booking.contractStatus === 'SIGNED' && (
                        <button className="w-full h-10 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" /> Descargar PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Evento / Sala */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-amber" />
                    Evento
                </h3>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs text-slate-500">Fecha del evento</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {new Date(booking.eventDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs text-slate-500">Sala</p>
                            <p className="text-sm font-semibold text-slate-900">{booking.venueName}</p>
                            <p className="text-xs text-slate-500">{booking.venueCity}</p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <Link
                            href="#"
                            className="text-xs font-bold text-slate-700 hover:text-brand-amber transition-colors flex items-center gap-1"
                        >
                            Ver perfil de la sala <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Progreso de Pago */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-brand-amber" />
                    Pagos
                </h3>
                <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-slate-900 tabular-nums">
                            {formatCurrency(booking.paymentPaid, booking.currency)}
                        </span>
                        <span className="text-sm text-slate-400">
                            de {formatCurrency(booking.totalAmount, booking.currency)}
                        </span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(booking.paymentPercent, 2)}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{booking.paymentPercent}% completado</span>
                        {booking.paymentPercent < 100 && (
                            <span className="text-amber-600 font-semibold">
                                Pendiente: {formatCurrency(booking.totalAmount - booking.paymentPaid, booking.currency)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
