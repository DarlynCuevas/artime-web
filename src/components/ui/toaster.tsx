import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/router';
import { AlertTriangle, Bell, X } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const router = useRouter();

  return (
    <div className="fixed left-0 right-0 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[100] flex w-full flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:top-4 sm:bottom-auto sm:max-w-[380px] sm:px-0">
      {toasts.map(({ id, title, description, variant, href }) => (
        <div
          key={id}
          onClick={() => {
            if (href) {
              router.push(href);
            }
            dismiss(id);
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            if (href) {
              router.push(href);
            }
            dismiss(id);
          }}
          role="button"
          tabIndex={0}
          className={`group relative w-full cursor-pointer select-none rounded-2xl border px-4 py-3 text-left shadow-[0_20px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl ring-1 ring-slate-900/5 transition-all animate-fade-in ${
            variant === 'destructive'
              ? 'border-rose-200/70 bg-rose-50/90 text-rose-950'
              : 'border-slate-200/70 bg-white/90 text-slate-900'
          }`}
        >
          <div className="flex items-start gap-3 pr-9">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                variant === 'destructive' ? 'bg-rose-500/10' : 'bg-amber-500/10'
              }`}
              aria-hidden="true"
            >
              {variant === 'destructive' ? (
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              ) : (
                <Bell className="h-4 w-4 text-amber-600" />
              )}
            </div>

            <div className="min-w-0">
              {title ? (
                <div className={`text-sm font-black ${variant === 'destructive' ? 'text-rose-950' : 'text-slate-900'}`}>
                  {title}
                </div>
              ) : null}
              {description ? (
                <div className={`mt-0.5 text-sm leading-snug ${variant === 'destructive' ? 'text-rose-800' : 'text-slate-600'}`}>
                  {description}
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss(id);
            }}
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100/70 hover:text-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
