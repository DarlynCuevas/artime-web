import { useMemo } from 'react';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarLegend } from './CalendarLegend';
import { BlockDayButton } from './BlockDayButton';

export type CalendarDay = {
  date: string; // ISO date (YYYY-MM-DD)
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  bookings?: Array<{
    id: string;
    title?: string;
    venueName?: string;
    startTime?: string;
    endTime?: string;
  }>;
};

type Props = {
  month: number; // 0-based month
  year: number;
  days: CalendarDay[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  onBlockDay?: (date: string) => void;
  onUnblockDay?: (date: string) => void;
};

export function ArtistCalendar({
  month,
  year,
  days,
  selectedDate,
  onSelectDate,
  onBlockDay,
  onUnblockDay,
}: Props) {
  const daysByDate = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    days.forEach((d) => map.set(d.date, d));
    return map;
  }, [days]);

  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  const totalDays = end.getUTCDate();
  const firstWeekday = start.getUTCDay(); // 0 = Sunday

  const cells: Array<CalendarDay | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= totalDays; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push(daysByDate.get(date) ?? { date, status: 'AVAILABLE', bookings: [] });
  }

  const selectedDay = selectedDate ? daysByDate.get(selectedDate) ?? null : null;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-slate-900 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Red de disponibilidad activa</p>
        </div>
        <CalendarLegend />
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-3 lg:gap-4">
        {['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 pb-4 select-none"
          >
            {d}
          </div>
        ))}
        {cells.map((day, idx) => (
          <CalendarDayCell
            key={idx}
            day={day}
            selected={!!selectedDate && day?.date === selectedDate}
            onSelectDate={onSelectDate}
          />
        ))}
      </div>

      <div className="pt-8 border-t border-slate-100">
        <BlockDayButton
          selectedDate={selectedDate ?? null}
          selectedStatus={selectedDay?.status ?? null}
          onBlockDay={onBlockDay}
          onUnblockDay={onUnblockDay}
        />
      </div>
    </div>
  );
}
