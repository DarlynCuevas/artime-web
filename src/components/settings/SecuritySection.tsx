'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, LogOut, Monitor, Shield } from 'lucide-react';
import { closeSessions } from '@/services/settings/settings.service';

interface Props {
    token: string;
    onLogout?: () => void;
}

export function SecuritySection({ token, onLogout }: Props) {
    const [closing, setClosing] = useState(false);
    const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleCloseSessions = async () => {
        setClosing(true);
        setMessage(null);
        setShowConfirm(false);
        try {
            await closeSessions(token);
            setMessage({ type: 'ok', text: 'Se han cerrado todas las demás sesiones activas. Solo esta sesión permanece activa.' });
        } catch (err: any) {
            setMessage({ type: 'err', text: err?.message ?? 'No se pudieron cerrar las sesiones' });
        } finally {
            setClosing(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Info card */}
            <div className="rounded-2xl bg-slate-50/60 border border-slate-100 p-4 flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-900">Seguridad de la cuenta</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
                        Gestiona las sesiones activas de tu cuenta. Si crees que alguien más ha accedido a tu cuenta, cierra las sesiones y cambia tu contraseña.
                    </p>
                </div>
            </div>

            {/* Sesiones activas */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Monitor className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Sesiones activas</span>
                </div>

                {/* Sesión actual */}
                <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Esta sesión</p>
                            <p className="text-xs text-slate-500 font-medium">El dispositivo y navegador actual</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                        Activa
                    </span>
                </div>

                <p className="text-xs text-slate-500 font-medium">
                    Las sesiones adicionales no se muestran por privacidad. Puedes cerrarlas todas de una vez usando el botón de abajo.
                </p>

                {message && (
                    <div className={`rounded-xl p-3 text-sm font-medium ${message.type === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    disabled={closing}
                    className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-60"
                >
                    {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    {closing ? 'Cerrando sesiones…' : 'Cerrar todas las demás sesiones'}
                </button>
            </section>

            {/* Cerrar sesión completo */}
            <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <LogOut className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Cerrar sesión</span>
                </div>
                <p className="text-sm font-medium text-slate-600">Cerrar la sesión en este dispositivo.</p>
                <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                </button>
            </section>

            {/* Modal confirmación cerrar sesiones */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl space-y-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-amber-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">¿Cerrar otras sesiones?</h3>
                            <p className="text-sm text-slate-500 font-medium">
                                Se cerrarán todas las sesiones activas excepto la actual. Tendrás que volver a iniciar sesión en esos dispositivos.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                Cancelar
                            </button>
                            <button onClick={handleCloseSessions} className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
