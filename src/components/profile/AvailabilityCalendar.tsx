import { useEffect, useState } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

import { useArtistAvailability } from '@/hooks/artists/useArtistAvailability';
import { useVenueAvailability } from '@/hooks/venues/useVenueAvailability';
import { getPublicArtistCalendarBlocks } from '@/services/artists/calendar.service';

interface AvailabilityCalendarProps {
    artistId?: string;
    venueId?: string;
    token?: string;
    /** Llamado cuando el usuario hace clic en un día DISPONIBLE */
    onDayClick?: (date: string) => void;
    /** Si true, los días no son clicables (modo solo lectura) */
    readOnly?: boolean;
    /** Si true, permite hacer clic en cualquier día (incluso ocupados/bloqueados) para la vista privada */
    interactiveMode?: boolean;
}

export function AvailabilityCalendar({
    artistId,
    venueId,
    token,
    onDayClick,
    readOnly = false,
    interactiveMode = false,
}: AvailabilityCalendarProps) {
    const [month, setMonth] = useState<Date>(new Date());
    const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const monthLabel = month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const { days: artistAvailability, loading: artistLoading } = useArtistAvailability(
        artistId || undefined,
        artistId || venueId ? month : undefined,
        token,
    );

    const { days: venueAvailability, loading: venueLoading } = useVenueAvailability(
        venueId || undefined,
        artistId || venueId ? month : undefined,
        token,
    );

    const availability = artistId ? artistAvailability : venueAvailability;
    const availabilityLoading = artistId ? artistLoading : venueLoading;

    useEffect(() => {
        if (!artistId || !token) {
            setBlockedDates(new Set());
            return;
        }

        const from = new Date(Date.UTC(month.getFullYear(), month.getMonth(), 1))
            .toISOString()
            .slice(0, 10);
        const to = new Date(Date.UTC(month.getFullYear(), month.getMonth() + 1, 0))
            .toISOString()
            .slice(0, 10);

        getPublicArtistCalendarBlocks(artistId, from, to, token)
            .then((data) => setBlockedDates(new Set((data ?? []).map((d: any) => d.date))))
            .catch(() => setBlockedDates(new Set()));
    }, [artistId, month, token]);

    const handleMonthChange = (delta: number) => {
        setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
        setSelectedDate(null);
    };

    const handleDayClick = (date: string) => {
        setSelectedDate(date);
        onDayClick?.(date);
    };

    return (
        <div>
            {/* Header con navegación */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 capitalize">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    {monthLabel}
                </h3>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => handleMonthChange(-1)}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        aria-label="Mes anterior"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 text-slate-600" />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleMonthChange(1)}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        aria-label="Mes siguiente"
                    >
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Cabecera días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">
                        {d}
                    </div>
                ))}
            </div>

            {/* Skeleton */}
            {availabilityLoading && (
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 28 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
                    ))}
                </div>
            )}

            {/* Sin datos */}
            {!availabilityLoading && availability.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">
                    No hay información de disponibilidad para este mes.
                </p>
            )}

            {/* Días */}
            {!availabilityLoading && availability.length > 0 && (
                <>
                    <div className="grid grid-cols-7 gap-2">
                        {availability.map((day) => {
                            const isBlocked = blockedDates.has(day.date);
                            const status = isBlocked
                                ? 'BLOCKED'
                                : day.status === 'BOOKED'
                                    ? 'BOOKED'
                                    : day.status === 'UNAVAILABLE'
                                        ? 'UNAVAILABLE'
                                        : 'AVAILABLE';
                            const isSelected = selectedDate === day.date;

                            // Determinar si el día puede ser interactuado
                            const isAvailableClickable = status === 'AVAILABLE' && !readOnly;
                            const isClickable = interactiveMode ? true : isAvailableClickable;

                            let cellClass =
                                'relative aspect-square rounded-xl border text-sm font-semibold transition-all duration-200 ';

                            if (status === 'BOOKED') {
                                cellClass += 'bg-white border-slate-300 text-slate-900 ';
                            } else if (status === 'BLOCKED') {
                                cellClass += 'bg-slate-100/70 border-slate-300 text-slate-700 ';
                            } else if (status === 'UNAVAILABLE') {
                                cellClass += 'bg-slate-50 border-slate-200 text-slate-400 ';
                            } else {
                                cellClass += 'bg-white border-slate-200 text-slate-800 ';
                            }

                            if (isClickable) {
                                cellClass += 'cursor-pointer hover:border-slate-400 ';
                            } else {
                                cellClass += 'cursor-not-allowed ';
                            }

                            if (isSelected) {
                                cellClass += ' ring-2 ring-slate-900/20';
                            }

                            const tooltipText =
                                status === 'BLOCKED'
                                    ? 'Bloqueado por el artista'
                                    : status === 'BOOKED'
                                        ? 'Booking confirmado'
                                        : status === 'UNAVAILABLE'
                                            ? 'No disponible'
                                            : 'Disponible';

                            return (
                                <button
                                    key={day.date}
                                    disabled={!isClickable}
                                    className={cellClass}
                                    onClick={() => { if (isClickable) handleDayClick(day.date); }}
                                    aria-label={`${day.date}: ${tooltipText}`}
                                    title={tooltipText}
                                >
                                    {status === 'BLOCKED' && (
                                        <span className="absolute left-1.5 top-2 bottom-2 w-0.5 rounded-full bg-slate-500/80" aria-hidden="true" />
                                    )}

                                    <span className="absolute inset-0 flex items-center justify-center">
                                        {day.date.slice(8, 10)}
                                    </span>

                                    {status === 'BOOKED' && (
                                        <span className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-900" aria-hidden="true" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Leyenda */}
                    <div className="mt-6 flex items-center gap-4 text-xs font-medium text-slate-500 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-white border border-slate-200" />
                            Disponible
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-white border border-slate-300 relative">
                                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-slate-800" />
                            </div>
                            Booking
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="relative w-3 h-3 rounded bg-slate-100 border border-slate-300">
                                <span className="absolute left-0 top-0 h-full w-0.5 rounded-full bg-slate-600" />
                            </div>
                            Bloqueado
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
