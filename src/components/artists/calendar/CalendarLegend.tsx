export function CalendarLegend() {
  const items = [
    { label: 'Disponible', tone: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { label: 'Reservado', tone: 'bg-amber-50 border-amber-200 text-amber-700' },
    { label: 'Bloqueado', tone: 'bg-slate-100 border-slate-200 text-slate-500' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div key={item.label} className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] ${item.tone}`}>
          <span className="h-2.5 w-2.5 rounded-full bg-current opacity-60" />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
