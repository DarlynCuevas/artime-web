import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { BadgeCheck, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import {
  getAdminVerifications,
  reviewAdminVerification,
  type AdminVerificationItem,
  type AdminVerificationStatus,
} from '@/services/admin/admin-verifications.service';

export default function AdminVerificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: meLoading } = useMe();
  const router = useRouter();
  const [status, setStatus] = useState<AdminVerificationStatus | 'ALL'>('PENDING');
  const [items, setItems] = useState<AdminVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminVerificationItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [authWaitExpired, setAuthWaitExpired] = useState(false);
  const [tokenIsAdmin, setTokenIsAdmin] = useState(false);

  useEffect(() => {
    if (!user?.token) {
      setTokenIsAdmin(false);
      return;
    }
    try {
      const payloadPart = user.token.split('.')[1];
      if (!payloadPart) {
        setTokenIsAdmin(false);
        return;
      }
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const decoded = JSON.parse(atob(padded));
      const roles = Array.isArray(decoded?.app_metadata?.roles) ? decoded.app_metadata.roles : [];
      setTokenIsAdmin(roles.includes('ADMIN'));
    } catch {
      setTokenIsAdmin(false);
    }
  }, [user?.token]);

  const effectiveIsAdmin = isAdmin || tokenIsAdmin;

  useEffect(() => {
    if (user?.token) {
      setAuthWaitExpired(false);
      return;
    }
    const timeout = setTimeout(() => setAuthWaitExpired(true), 1500);
    return () => clearTimeout(timeout);
  }, [user?.token]);

  const load = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminVerifications(user.token, status);
      setItems(data);
      setSelected((prev) => (prev ? data.find((item) => item.userId === prev.userId) ?? null : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, [status, user?.token]);

  useEffect(() => {
    if (authLoading || meLoading) return;
    // Evita bucle landing <-> admin por desincronización temporal de sesión tras login.
    if (!user?.token) {
      if (authWaitExpired) {
        router.replace('/login');
      }
      return;
    }
    if (!effectiveIsAdmin) return;
    load();
  }, [user?.token, authLoading, meLoading, effectiveIsAdmin, status, load, router, authWaitExpired]);

  const empty = useMemo(() => !loading && !error && items.length === 0, [loading, error, items.length]);

  const review = async (nextStatus: 'VERIFIED' | 'REJECTED') => {
    if (!user?.token || !selected) return;
    if (nextStatus === 'REJECTED' && !rejectionReason.trim()) return;
    setSaving(true);
    try {
      await reviewAdminVerification(user.token, selected.userId, {
        status: nextStatus,
        rejectionReason: nextStatus === 'REJECTED' ? rejectionReason.trim() : null,
      });
      setRejectionReason('');
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || meLoading || (!user?.token && !authWaitExpired)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!effectiveIsAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Admin</p>
          <h1 className="mt-1 text-xl font-black text-slate-900">Acceso no autorizado</h1>
          <p className="mt-2 text-sm text-slate-600">Tu cuenta no tiene permisos ADMIN en el token activo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Admin</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Verificaciones</h1>
        </header>

        <div className="flex flex-wrap gap-2">
          {(['PENDING', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                status === value ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
            ) : empty ? (
              <p className="py-12 text-center text-sm text-slate-500">No hay verificaciones en este estado.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.userId}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      selected?.userId === item.userId ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900">{item.user?.displayName || item.user?.email || item.userId}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">{item.user?.email || 'Sin email en perfil'}</p>
                    <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-slate-400">{item.status}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            {!selected ? (
              <div className="py-16 text-center text-sm text-slate-500">Selecciona una verificación para revisar.</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-black text-slate-900">{selected.user?.displayName || selected.user?.email || selected.userId}</p>
                  <p className="text-xs text-slate-500">{selected.user?.email || selected.userId}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Documentos</p>
                  {(selected.documentPaths ?? []).length ? (
                    <ul className="mt-2 space-y-1">
                      {(selected.documentPaths ?? []).map((path) => (
                        <li key={path} className="text-xs text-slate-700 break-all">{path}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No hay rutas de documento.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Motivo de rechazo</label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="Obligatorio para rechazar"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => review('VERIFIED')}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => review('REJECTED')}
                    disabled={saving || !rejectionReason.trim()}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Rechazar
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
