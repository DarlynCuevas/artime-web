import { CalendarDay } from './ArtistCalendar';

type Props = {
  day: CalendarDay | null;
  selected?: boolean;
  onSelectDate?: (date: string) => void;
};

const STATUS_CLASSES: Record<CalendarDay['status'], string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300',
  BOOKED: 'bg-amber-50 text-amber-800 border-amber-200 cursor-not-allowed',
  BLOCKED: 'bg-slate-100 text-slate-500 border-slate-200',
};

export function CalendarDayCell({ day, selected, onSelectDate }: Props) {
  if (!day) return <div />;

  const isSelected = !!selected;

  return (
    <button
      type="button"
      className={`w-full aspect-square rounded-lg border p-2 text-left transition ${STATUS_CLASSES[day.status]} ${
        isSelected ? 'ring-2 ring-slate-900/30' : ''
      }`}
      onClick={() => onSelectDate?.(day.date)}
      disabled={day.status === 'BOOKED'}
    >
      <div className="text-sm font-semibold mb-1">{day.date.slice(-2)}</div>
      {day.bookings && day.bookings.length > 0 && (
        <div className="text-[11px] text-slate-600">
          {day.bookings.length} booking{day.bookings.length > 1 ? 's' : ''}
        </div>
      )}
      {day.status === 'BLOCKED' && (
        <div className="text-[11px] text-slate-500">Bloqueado</div>
      )}
    </button>
  );
}
