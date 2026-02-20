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
    <div className="grid gap-4">
      <CalendarLegend />
      <div className="grid grid-cols-7 gap-2">
        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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
      <BlockDayButton
        selectedDate={selectedDate ?? null}
        selectedStatus={selectedDay?.status ?? null}
        onBlockDay={onBlockDay}
        onUnblockDay={onUnblockDay}
      />
    </div>
  );
}
