import Link from 'next/link';

export default function StripeRefresh() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-6 text-center space-y-4">
        <p className="text-lg font-semibold text-slate-900">Reintentar conexión con Stripe</p>
        <p className="text-sm text-slate-600">
          Vuelve a iniciar el proceso de onboarding para completar los datos pendientes en Stripe.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/settings?tab=verification"
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400 transition"
          >
            Reanudar onboarding
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
