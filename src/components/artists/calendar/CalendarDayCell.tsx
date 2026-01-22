import { CalendarDay } from './ArtistCalendar';

type Props = {
  day: CalendarDay | null;
  selected?: boolean;
  onSelectDate?: (date: string) => void;
};

const STATUS_COLORS: Record<CalendarDay['status'], string> = {
  AVAILABLE: '#e8f5e9',
  BOOKED: '#ffe8e6',
  BLOCKED: '#f3f4f6',
};

export function CalendarDayCell({ day, selected, onSelectDate }: Props) {
  if (!day) return <div />;

  const bg = STATUS_COLORS[day.status];
  const isSelected = !!selected;

  return (
    <button
      type="button"
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        border: isSelected ? '2px solid #111' : '1px solid #ddd',
        borderRadius: 8,
        background: bg,
        padding: 8,
        textAlign: 'left',
        cursor: 'pointer',
      }}
      onClick={() => onSelectDate?.(day.date)}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{day.date.slice(-2)}</div>
      {day.bookings && day.bookings.length > 0 && (
        <div style={{ fontSize: 12, color: '#d14343' }}>
          {day.bookings.length} booking{day.bookings.length > 1 ? 's' : ''}
        </div>
      )}
      {day.status === 'BLOCKED' && (
        <div style={{ fontSize: 12, color: '#555' }}>Bloqueado</div>
      )}
    </button>
  );
}
