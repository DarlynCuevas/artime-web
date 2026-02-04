import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CommissionInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string | null;
}

export function CommissionInput({ label = 'Porcentaje de comisión', error, className, ...props }: CommissionInputProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      <span className="font-semibold text-slate-900">{label}</span>
      <div className="relative">
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          className={cn(
            'w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200',
            className,
          )}
          {...props}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">%</span>
      </div>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}
