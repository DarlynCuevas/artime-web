import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ManagerSidebarCardProps {
    name: string;
    agency: string;
    avatarUrl: string;
    bio: string;
    onViewProfile?: () => void;
    className?: string;
}

export function ManagerSidebarCard({
    name,
    agency,
    avatarUrl,
    bio,
    onViewProfile,
    className = '',
}: ManagerSidebarCardProps) {
    return (
        <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group flex flex-col justify-between lg:min-h-[148px] ${className}`}>
            <div className="flex items-start gap-4">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900">{name}</h3>
                    <p className="text-xs text-brand-amber font-medium">{agency}</p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {bio}
                    </p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                    onClick={onViewProfile}
                    className="text-xs font-bold text-slate-900 hover:text-brand-amber transition-colors flex items-center gap-1"
                >
                    Ver perfil del mánager <ChevronRight className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Representante</span>
            </div>
        </div>
    );
}
