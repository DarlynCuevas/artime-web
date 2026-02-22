import React, { ReactNode } from 'react';
import { MapPin, Music2, CheckCircle2 } from 'lucide-react';

interface ProfileHeroProps {
    name: string;
    typeLabel: string;
    location: string;
    genres: string[];
    managerName: string;
    avatarUrl: string;
    actionElement?: ReactNode; // Espacio para el PricingCard o menú de acción
}

export function ProfileHero({
    name,
    typeLabel,
    location,
    genres,
    managerName,
    avatarUrl,
    actionElement,
}: ProfileHeroProps) {
    return (
        <div className="relative w-full h-[340px] md:h-[400px] overflow-hidden bg-fintech-dark font-sans">
            {/* Abstract background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-fintech-dark via-slate-800 to-fintech-dark opacity-90" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-amber rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20" />

            {/* Contenido Hero */}
            <div className="relative h-full max-w-5xl mx-auto px-6 flex flex-col justify-end pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">

                    <div className="lg:col-span-2 animate-slide-in flex items-end gap-6">
                        {/* Pro Avatar */}
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-slate-900 bg-slate-800 shadow-2xl shrink-0">
                            <img
                                src={avatarUrl}
                                alt={name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
                        </div>

                        <div className="mb-2">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-2.5 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white/90 text-xs font-medium uppercase tracking-wider">
                                    {typeLabel}
                                </span>
                                <span className="flex items-center gap-1 text-white/70 text-sm">
                                    <MapPin className="w-4 h-4" /> {location}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-5xl font-black text-white tracking-tight mb-2">
                                {name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
                                <div className="flex items-center gap-1.5">
                                    <Music2 className="w-4 h-4" />
                                    <span>{genres.join(' • ')}</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-white/30 hidden md:block" />
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Representado por {managerName}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Region (e.g. Fintech Price Card) */}
                    {actionElement && (
                        <div className="hidden lg:flex flex-col flex-1 animate-fade-in mb-2 w-full" style={{ animationDelay: '150ms' }}>
                            {actionElement}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
