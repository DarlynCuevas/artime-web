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
}

export function AvailabilityCalendar({
    artistId,
    venueId,
    token,
    onDayClick,
    readOnly = false,
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
                            const status = isBlocked ? 'UNAVAILABLE' : day.status;
                            const isSelected = selectedDate === day.date;
                            const isClickable = status === 'AVAILABLE' && !readOnly;

                            let cellClass =
                                'aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 ';

                            if (status === 'UNAVAILABLE') {
                                // Día no disponible — transparente, sin fondo
                                cellClass += 'text-slate-300 bg-transparent cursor-not-allowed';
                            } else if (status === 'BOOKED') {
                                // Ocupado — tachado, fondo punteado
                                cellClass += 'bg-slate-100/50 text-slate-400 line-through cursor-not-allowed border border-dashed border-slate-200';
                            } else if (isSelected) {
                                // Seleccionado — ámbar sólido
                                cellClass += 'bg-amber-500 text-amber-950 shadow-md scale-105 border border-amber-400';
                            } else if (isClickable) {
                                // Disponible + clicable — slate-50 con hover ámbar
                                cellClass += 'text-slate-700 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 hover:shadow-sm hover:scale-105 border border-slate-100 hover:border-amber-200 cursor-pointer';
                            } else {
                                // Disponible pero readOnly
                                cellClass += 'text-slate-700 bg-slate-50 border border-slate-100 cursor-default';
                            }

                            return (
                                <button
                                    key={day.date}
                                    disabled={!isClickable}
                                    className={cellClass}
                                    onClick={() => { if (isClickable) handleDayClick(day.date); }}
                                    aria-label={`${day.date}: ${status}`}
                                >
                                    {day.date.slice(8, 10)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Leyenda */}
                    <div className="mt-6 flex items-center gap-4 text-xs font-medium text-slate-500 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-slate-50 border border-slate-100" />
                            Libre
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-slate-100 border border-dashed border-slate-200" />
                            Ocupado
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-amber-500" />
                            Seleccionado
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
