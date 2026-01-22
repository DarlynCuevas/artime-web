import { useState } from 'react';
import { CalendarDay } from './ArtistCalendar';

type Props = {
  daysByDate: Map<string, CalendarDay>;
};

export function CalendarDayDrawer({ daysByDate }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const day = selected ? daysByDate.get(selected) : null;

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <input
          type="date"
          value={selected ?? ''}
          onChange={(e) => setSelected(e.target.value || null)}
          style={{ padding: 8 }}
        />
        <span style={{ color: '#555', fontSize: 13 }}>
          Selecciona un día para ver detalle
        </span>
      </div>

      {!day && <p style={{ color: '#666' }}>Sin día seleccionado.</p>}

      {day && (
        <div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Día {day.date}</p>
          <p style={{ color: '#555', marginBottom: 12 }}>Estado: {day.status}</p>

          {day.bookings && day.bookings.length > 0 ? (
            <ul style={{ paddingLeft: 16, margin: 0, display: 'grid', gap: 8 }}>
              {day.bookings.map((b) => (
                <li key={b.id}>
                  <div style={{ fontWeight: 600 }}>{b.title ?? 'Booking'}</div>
                  {b.venueName && <div style={{ color: '#555' }}>{b.venueName}</div>}
                  {(b.startTime || b.endTime) && (
                    <div style={{ color: '#777', fontSize: 13 }}>
                      {b.startTime ?? ''} {b.endTime ? `- ${b.endTime}` : ''}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#666' }}>Sin bookings este día.</p>
          )}
        </div>
      )}
    </div>
  );
}
