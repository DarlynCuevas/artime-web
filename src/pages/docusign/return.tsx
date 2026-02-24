import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { useMe } from '@/hooks/auth/useMe';

export default function DocusignReturnPage() {
  const router = useRouter();
  const { loading, role } = useMe();

  const destination = useMemo(() => {
    if (role === 'ARTIST') return '/artists/bookings';
    if (role === 'VENUE') return '/venues/bookings';
    if (role === 'PROMOTER') return '/promoter/bookings';
    if (role === 'MANAGER') return '/manager/bookings';
    return '/';
  }, [role]);

  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(() => {
      void router.replace(destination);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [loading, destination, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-6 text-center space-y-4">
        <p className="text-lg font-semibold text-slate-900">Firma completada</p>
        <p className="text-sm text-slate-600">Volviendo a tus bookings para refrescar el estado del contrato.</p>
        <Link
          href={destination}
          className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400 transition"
        >
          Continuar
        </Link>
      </div>
    </main>
  );
}
