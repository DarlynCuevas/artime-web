export function CalendarLegend() {
  const items = [
    { label: 'Disponible', type: 'available' as const },
    { label: 'Reservado', type: 'booked' as const },
    { label: 'Bloqueado', type: 'blocked' as const },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
          {item.type === 'available' && (
            <span className="h-2.5 w-2.5 rounded-sm border border-slate-300 bg-white" />
          )}
          {item.type === 'booked' && (
            <span className="relative h-2.5 w-2.5 rounded-sm border border-slate-400 bg-white">
              <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-slate-800" />
            </span>
          )}
          {item.type === 'blocked' && (
            <span className="relative h-2.5 w-2.5 rounded-sm border border-slate-300 bg-slate-100">
              <span className="absolute left-0 top-0 h-full w-0.5 rounded-full bg-slate-600" />
            </span>
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
