import { useState } from 'react';
import { useRouter } from 'next/router';
import {
    BadgeCheck,
    Bell,
    Building2,
    ChevronRight,
    KeyRound,
    Loader2,
    Settings,
    Shield,
    User,
} from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { supabase } from '@/services/supabase/supabaseClient';
import { FiscalSection } from '@/components/settings/FiscalSection';
import { AccountSection } from '@/components/settings/AccountSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { SecuritySection } from '@/components/settings/SecuritySection';
import { VerificationSection } from '@/components/settings/VerificationSection';
import type { UserRole } from '@/types/user-role';

type TabId = 'fiscal' | 'account' | 'notifications' | 'security' | 'verification';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const tabs: Tab[] = [
    { id: 'fiscal', label: 'Datos fiscales', icon: <Building2 className="w-4 h-4" /> },
    { id: 'account', label: 'Mi cuenta', icon: <User className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notificaciones', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Seguridad', icon: <Shield className="w-4 h-4" /> },
    { id: 'verification', label: 'Verificación', icon: <BadgeCheck className="w-4 h-4" /> },
];

const tabTitles: Record<TabId, { title: string; subtitle: string }> = {
    fiscal: {
        title: 'Datos fiscales',
        subtitle: 'Tu información fiscal para la generación de facturas y pagos.',
    },
    account: {
        title: 'Mi cuenta',
        subtitle: 'Gestiona tu email, contraseña y acceso a la plataforma.',
    },
    notifications: {
        title: 'Notificaciones',
        subtitle: 'Elige qué comunicaciones quieres recibir de Artime.',
    },
    security: {
        title: 'Seguridad',
        subtitle: 'Controla los dispositivos y sesiones con acceso a tu cuenta.',
    },
    verification: {
        title: 'Verificación de perfil',
        subtitle: 'Verifica tu identidad para obtener el badge de perfil verificado.',
    },
};

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useMe();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>('fiscal');

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (authLoading || roleLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!user?.token) {
        router.push('/login');
        return null;
    }

    const currentTab = tabTitles[activeTab];

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -top-40 -left-32 w-[600px] h-[600px] rounded-full bg-amber-100/40 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 -right-40 w-[500px] h-[400px] rounded-full bg-slate-200/40 blur-3xl" />

            <div className="relative max-w-6xl mx-auto px-4 py-10 sm:px-8">

                {/* ─── Page header ─────────────────────────────────────────────────── */}
                <header className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Configuración</p>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                                Tu cuenta
                            </h1>
                        </div>
                    </div>
                    {role && (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-700">
                            <KeyRound className="w-3 h-3" />
                            {role}
                        </div>
                    )}
                </header>

                {/* ─── Layout: sidebar + content ────────────────────────────────── */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Sidebar tabs (desktop) / pill tabs (mobile) */}
                    <nav className="lg:w-56 shrink-0">
                        {/* Mobile: horizontal scroll pills */}
                        <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 ${activeTab === tab.id
                                            ? 'bg-slate-900 text-white shadow-md'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Desktop: vertical list */}
                        <div className="hidden lg:flex flex-col gap-1 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-2 shadow-sm">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 w-full rounded-2xl px-4 py-3 text-sm font-bold text-left transition-all group ${activeTab === tab.id
                                            ? 'bg-slate-900 text-white shadow-lg'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <span className={activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 transition-colors'}>
                                        {tab.icon}
                                    </span>
                                    <span className="flex-1">{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* Content panel */}
                    <main className="flex-1">
                        <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-sm overflow-hidden">
                            {/* Section header */}
                            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white/40">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{currentTab.title}</h2>
                                <p className="text-sm font-medium text-slate-500 mt-0.5">{currentTab.subtitle}</p>
                            </div>

                            {/* Section body */}
                            <div className="px-8 py-8">
                                {activeTab === 'fiscal' && (
                                    <FiscalSection token={user.token} role={(role as UserRole) ?? 'ARTIST'} />
                                )}
                                {activeTab === 'account' && (
                                    <AccountSection
                                        token={user.token}
                                        onLogout={handleLogout}
                                    />
                                )}
                                {activeTab === 'notifications' && (
                                    <NotificationsSection token={user.token} />
                                )}
                                {activeTab === 'security' && (
                                    <SecuritySection token={user.token} onLogout={handleLogout} />
                                )}
                                {activeTab === 'verification' && (
                                    <VerificationSection token={user.token} />
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
