import React, { ReactNode, useState } from 'react';
import { MapPin, Music2, CheckCircle2 } from 'lucide-react';
import { VerificationBanner } from '@/components/profile/VerificationBanner';

interface ProfileHeroProps {
    name: string;
    typeLabel: string;
    location: string;
    genres: string[];
    managerName?: string;
    avatarUrl: string;
    isVerified?: boolean;
    actionElement?: ReactNode; // Espacio para el PricingCard o menú de acción
}

export function ProfileHero({
    name,
    typeLabel,
    location,
    genres,
    managerName,
    avatarUrl,
    isVerified = false,
    actionElement,
}: ProfileHeroProps) {
    const [avatarFailed, setAvatarFailed] = useState(false);

    return (
        <div className="relative w-full h-[248px] md:h-[288px] overflow-hidden bg-fintech-dark font-sans rounded-3xl">
            {/* Abstract background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20" />

            {isVerified ? (
                <VerificationBanner
                    variant="badge"
                    className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6"
                />
            ) : null}

            {/* Contenido Hero */}
            <div className="relative h-full max-w-5xl mx-auto px-6 flex flex-col justify-center py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">

                    <div className="lg:col-span-2 animate-slide-in flex items-center gap-6">
                        {/* Pro Avatar */}
                        <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-slate-900 bg-slate-800 shadow-2xl shrink-0 backdrop-blur-sm">
                            {!avatarFailed ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={avatarUrl}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                    onError={() => setAvatarFailed(true)}
                                />
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-4xl md:text-5xl font-black text-white/20 select-none">
                                            {name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/10 to-transparent" />
                                </>
                            )}
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-full" />
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-2.5 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white/90 text-xs font-medium uppercase tracking-wider">
                                    {typeLabel}
                                </span>
                                <span className="flex items-center gap-1 text-white/70 text-sm">
                                    <MapPin className="w-4 h-4" /> {location}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-5xl font-black text-white tracking-tight mb-2">
                                <span className="inline-flex items-center gap-2">
                                    {name}
                                    {managerName ? (
                                        <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-400" />
                                    ) : null}
                                </span>
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
                                <div className="flex items-center gap-1.5">
                                    <Music2 className="w-4 h-4" />
                                    <span>{genres.join(' • ')}</span>
                                </div>
                                {managerName ? (
                                    <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200">
                                        Manager activo
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Action Region (e.g. Fintech Price Card) */}
                    {actionElement && (
                        <div className="hidden lg:flex flex-col flex-1 animate-fade-in w-full" style={{ animationDelay: '150ms' }}>
                            {actionElement}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
