import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export default function StripeReturn() {
  const router = useRouter();
  const message = useMemo(() => {
    const status = router.query?.status as string | undefined;
    if (status === 'success') return 'Stripe conectado correctamente. Ya puedes cerrar esta ventana.';
    if (status === 'failure') return 'No pudimos confirmar la conexión. Revisa tu cuenta Stripe.';
    return 'Stripe ha redirigido correctamente. Comprueba tu estado en Ajustes.';
  }, [router.query]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-6 text-center space-y-4">
        <p className="text-lg font-semibold text-slate-900">Conexión Stripe</p>
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/settings?tab=verification"
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400 transition"
          >
            Ir a Ajustes
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
