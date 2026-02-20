import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/router';

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const router = useRouter();

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-[360px] flex-col gap-2">
      {toasts.map(({ id, title, description, variant, href }) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            if (href) {
              router.push(href);
            }
            dismiss(id);
          }}
          className={`text-left rounded-lg border px-4 py-3 shadow-sm ${
            variant === 'destructive'
              ? 'border-red-200 bg-red-50 text-red-900'
              : 'border-slate-200 bg-white text-slate-900'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1">
              {title ? <div className="text-sm font-semibold">{title}</div> : null}
              {description ? <div className="text-sm text-slate-600">{description}</div> : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(id)}
              className="rounded-md p-1 text-slate-400 hover:text-slate-700"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </button>
      ))}
    </div>
  );
}
