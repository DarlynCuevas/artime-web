import { ShieldCheck } from 'lucide-react';

export function VerificationBanner() {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-2 text-emerald-300">
        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <p className="text-sm sm:text-base font-semibold tracking-tight">
          Perfil verificado en ARTIME
        </p>
      </div>
    </div>
  );
}
