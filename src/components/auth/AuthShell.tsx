import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

type Props = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  icon: ReactNode;
  backHref?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  eyebrow = 'ARTIME',
  icon,
  backHref = '/',
  children,
  footer,
}: Props) {
  return (
    <main className="min-h-[100svh] bg-slate-50 text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full bg-brand-amber blur-[140px] opacity-15" />
        <div className="absolute -bottom-48 -left-48 h-[520px] w-[520px] rounded-full bg-blue-500 blur-[160px] opacity-10" />

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Form */}
            <div className="flex flex-col">
              <Link
                href={backHref}
                className="inline-flex w-fit items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-amber-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>

              <div className="mt-6 rounded-[32px] border border-slate-200/70 bg-white/75 backdrop-blur-xl shadow-[0_30px_80px_rgba(15,23,42,0.10)] overflow-hidden">
                <div className="px-6 sm:px-8 py-6 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shrink-0">
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                        {eyebrow}
                      </p>
                      <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight">
                        {title}
                      </h1>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">{children}</div>

                {footer ? (
                  <div className="px-6 sm:px-8 py-5 border-t border-slate-100 bg-white/60">
                    {footer}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Visual */}
            <aside className="hidden lg:block">
              <div className="h-full rounded-[32px] overflow-hidden border border-white/50 bg-white/60 backdrop-blur-xl shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
                <div className="relative h-full min-h-[520px]">
                  <img
                    src="/hero-backstage.jpg"
                    alt="Backstage de un evento"
                    className="h-full w-full object-cover"
                    style={{ filter: 'saturate(0.9) contrast(1.02) brightness(0.9)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />

                  <div className="absolute left-6 right-6 bottom-6 rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-5 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">
                      Profesional, sin opacidad
                    </p>
                    <p className="mt-1 text-lg font-black leading-tight">
                      Lo importante sucede dentro del sistema.
                    </p>
                    <p className="mt-2 text-sm text-white/75 leading-relaxed">
                      Negociación registrada, contrato claro y pagos centralizados.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

