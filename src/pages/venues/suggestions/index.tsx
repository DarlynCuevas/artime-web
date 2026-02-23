import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bookmark, CheckCircle2, Loader2, MapPin, XCircle } from 'lucide-react';

import { withRole } from '@/components/auth/withRole';
import { useAuth } from '@/hooks/auth/useAuth';
import {
  listVenueSuggestions,
  updateVenueSuggestionStatus,
  type VenueSuggestion,
  type VenueSuggestionStatus,
} from '@/services/suggestions/suggestions.service';

const TABS: Array<{ key: 'ALL' | VenueSuggestionStatus; label: string }> = [
  { key: 'ALL', label: 'Todas' },
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'SAVED', label: 'Guardadas' },
  { key: 'DECLINED', label: 'Descartadas' },
];

function VenueSuggestionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ALL' | VenueSuggestionStatus>('PENDING');
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listVenueSuggestions(user.token, activeTab);
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las sugerencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.token]);

  const title = useMemo(() => {
    if (activeTab === 'PENDING') return 'Sugerencias pendientes';
    if (activeTab === 'SAVED') return 'Sugerencias guardadas';
    if (activeTab === 'DECLINED') return 'Sugerencias descartadas';
    return 'Todas las sugerencias';
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="relative w-full overflow-hidden bg-fintech-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-10 sm:px-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Inbox</p>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Sugerencias de artistas</h1>
          <p className="mt-2 text-sm text-white/70">{title}</p>
        </div>
      </div>

      <main className="mx-auto mt-6 max-w-6xl space-y-4 px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest transition ${active ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando sugerencias...
          </div>
        )}

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {!loading && !error && suggestions.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No hay sugerencias en esta bandeja.
          </div>
        )}

        {!loading && !error && suggestions.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {suggestions.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-900">{item.artistName}</p>
                    <p className="mt-1 text-sm text-slate-500">Sugerido por {item.managerName}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {item.artistCity || 'Sin ciudad'}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    {item.status}
                  </span>
                </div>

                {item.message && <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{item.message}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/artists/profile/${item.artistId}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Ver artista <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    disabled={updatingId === item.id}
                    onClick={async () => {
                      if (!user?.token) return;
                      setUpdatingId(item.id);
                      try {
                        await updateVenueSuggestionStatus(user.token, item.id, 'SAVED');
                        await load();
                      } finally {
                        setUpdatingId(null);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <Bookmark className="h-3.5 w-3.5" /> Guardar
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === item.id}
                    onClick={async () => {
                      if (!user?.token) return;
                      setUpdatingId(item.id);
                      try {
                        await updateVenueSuggestionStatus(user.token, item.id, 'DECLINED');
                        await load();
                      } finally {
                        setUpdatingId(null);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Descartar
                  </button>
                  <Link
                    href={`/bookings/new?artistId=${encodeURIComponent(item.artistId)}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white hover:bg-emerald-500"
                    onClick={async () => {
                      if (!user?.token) return;
                      try {
                        await updateVenueSuggestionStatus(user.token, item.id, 'ACCEPTED');
                      } catch {
                        // no bloquear navegación
                      }
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Iniciar contratación
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default withRole(VenueSuggestionsPage, ['VENUE']);
