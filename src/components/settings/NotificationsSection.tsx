'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, Save } from 'lucide-react';
import {
    getNotificationPreferences,
    updateNotificationPreferences,
    type NotificationPreferences,
} from '@/services/settings/settings.service';

interface Props {
    token: string;
}

const defaultPrefs: NotificationPreferences = {
    bookings: true,
    payments: true,
    messages: true,
    system: true,
    marketing: false,
    suggestions: true,
};

const labels: Record<keyof NotificationPreferences, { title: string; description: string }> = {
    bookings: {
        title: 'Bookings y reservas',
        description: 'Nuevas propuestas, cambios de estado y confirmaciones.',
    },
    payments: {
        title: 'Pagos y cobros',
        description: 'Transferencias recibidas, liquidaciones y facturación.',
    },
    messages: {
        title: 'Mensajes y negociaciones',
        description: 'Mensajes de salas, promotores o artistas.',
    },
    system: {
        title: 'Alertas del sistema',
        description: 'Actualizaciones críticas de la plataforma y seguridad.',
    },
    marketing: {
        title: 'Novedades y marketing',
        description: 'Noticias de Artime, nuevas funcionalidades y ofertas.',
    },
    suggestions: {
        title: 'Sugerencias de managers',
        description: 'Nuevas sugerencias de artistas para tu sala y sus actualizaciones.',
    },
};

export function NotificationsSection({ token }: Props) {
    const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    useEffect(() => {
        setLoading(true);
        getNotificationPreferences(token)
            .then(data => setPrefs(data))
            .catch(() => {/* use defaults */ })
            .finally(() => setLoading(false));
    }, [token]);

    const toggle = (key: keyof NotificationPreferences) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await updateNotificationPreferences(prefs, token);
            setMessage({ type: 'ok', text: 'Preferencias guardadas correctamente.' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: unknown) {
            setMessage({ type: 'err', text: err instanceof Error ? err.message : 'No se pudieron guardar las preferencias' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl bg-slate-50/60 border border-slate-100 p-4 flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    Elige qué tipo de emails quieres recibir de Artime. Las notificaciones de seguridad siempre se enviarán.
                </p>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                {(Object.entries(labels) as [keyof NotificationPreferences, typeof labels[keyof typeof labels]][]).map(
                    ([key, { title, description }]) => (
                        <div key={key} className="flex items-center justify-between gap-4 p-5 hover:bg-slate-50/60 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${prefs[key] ? 'bg-amber-100' : 'bg-slate-100'}`}>
                                    {prefs[key]
                                        ? <Bell className="w-4 h-4 text-amber-600" />
                                        : <BellOff className="w-4 h-4 text-slate-400" />
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">{description}</p>
                                </div>
                            </div>

                            {/* Toggle */}
                            <button
                                type="button"
                                onClick={() => toggle(key)}
                                disabled={key === 'system'} // system siempre activo
                                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all ${prefs[key] ? 'bg-amber-500' : 'bg-slate-200'
                                    } disabled:opacity-60`}
                                aria-label={`Toggle ${title}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    ),
                )}
            </div>

            {message && (
                <div className={`rounded-xl p-3 text-sm font-medium ${message.type === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
                    {message.text}
                </div>
            )}

            <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60"
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Guardando…' : 'Guardar preferencias'}
            </button>
        </div>
    );
}
