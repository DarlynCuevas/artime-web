import { cn } from '@/lib/utils';

type RepresentationStatus = 'NONE' | 'PENDING' | 'ACTIVE' | 'REJECTED';

const map: Record<RepresentationStatus, { label: string; className: string }> = {
  NONE: { label: 'Sin manager', className: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' },
  PENDING: { label: 'Solicitud pendiente', className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' },
  ACTIVE: { label: 'Manager activo', className: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' },
  REJECTED: { label: 'Solicitud rechazada', className: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200' },
};

export function RepresentationStatusBadge({ status, className }: { status: RepresentationStatus; className?: string }) {
  const cfg = map[status] ?? map.NONE;
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', cfg.className, className)}>{cfg.label}</span>;
}
