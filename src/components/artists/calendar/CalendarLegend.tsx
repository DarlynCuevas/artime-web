export function CalendarLegend() {
  const items = [
    { label: 'Disponible', color: '#e8f5e9' },
    { label: 'Reservado', color: '#ffe8e6' },
    { label: 'Bloqueado', color: '#f3f4f6' },
  ];

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: item.color,
              border: '1px solid #ccc',
            }}
          />
          <span style={{ fontSize: 13, color: '#444' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
