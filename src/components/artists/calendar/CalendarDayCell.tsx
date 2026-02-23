import { CalendarDay } from './ArtistCalendar';

type Props = {
  day: CalendarDay | null;
  selected?: boolean;
  onSelectDate?: (date: string) => void;
};

const STATUS_CLASSES: Record<CalendarDay['status'], string> = {
  AVAILABLE: 'bg-white border-slate-200 text-slate-800 hover:border-slate-400',
  BOOKED: 'bg-white border-slate-300 text-slate-900 hover:border-slate-500',
  BLOCKED: 'bg-slate-100/70 border-slate-300 text-slate-700 hover:border-slate-400',
};

export function CalendarDayCell({ day, selected, onSelectDate }: Props) {
  if (!day) return <div />;

  const isSelected = !!selected;

  return (
    <button
      type="button"
      className={`relative w-full aspect-square rounded-lg border p-2 text-left transition ${STATUS_CLASSES[day.status]} ${
        isSelected ? 'ring-2 ring-slate-900/30' : ''
      }`}
      onClick={() => onSelectDate?.(day.date)}
      title={
        day.status === 'BLOCKED'
          ? 'Bloqueado por el artista'
          : day.status === 'BOOKED'
            ? `Booking confirmado${day.bookings?.[0]?.venueName ? ` - ${day.bookings[0].venueName}` : ''}`
            : 'Disponible'
      }
    >
      {day.status === 'BLOCKED' && (
        <span className="absolute left-1.5 top-2 bottom-2 w-0.5 rounded-full bg-slate-500/80" aria-hidden="true" />
      )}

      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{day.date.slice(-2)}</div>

      {day.status === 'BOOKED' && (
        <span className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-900" aria-hidden="true" />
      )}
    </button>
  );
}
