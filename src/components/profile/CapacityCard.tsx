import React from 'react';
import { Users } from 'lucide-react';

interface CapacityCardProps {
    capacity?: number | null;
    buttonText?: string;
    onActionClick?: () => void;
    className?: string;
    disabled?: boolean;
    disabledMessage?: string;
}

export function CapacityCard({
    capacity,
    buttonText = 'Enviar Propuesta',
    onActionClick,
    className = '',
    disabled = false,
    disabledMessage,
}: CapacityCardProps) {
    return (
        <div className={`bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-col shadow-2xl ${className}`}>
            {/* Upper part: Capacity */}
            <div className="flex flex-col mb-4 items-center text-center">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    Aforo Máximo
                </span>
                <div className="flex items-baseline gap-1 justify-center">
                    <span className="text-4xl font-black text-white tabular-nums tracking-tighter leading-none">
                        {capacity ? capacity.toLocaleString('es-ES') : '—'}
                    </span>
                    <span className="text-xl font-bold text-slate-500 leading-none">pax.</span>
                </div>
                <span className="text-emerald-500 text-xs mt-2 font-bold uppercase tracking-wider flex items-center gap-1 justify-center">
                    <Users className="w-3.5 h-3.5" />
                    Capacidad
                </span>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-slate-700/50 mb-4" />

            {/* Lower part: Action/Info */}
            <div className="flex flex-col gap-2">
                <button
                    disabled={disabled}
                    className={`w-full h-11 rounded-xl font-bold text-sm transition-all duration-200 ${disabled
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-brand-amber hover:bg-amber-400 text-amber-950 shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.23)] hover:-translate-y-0.5'
                        }`}
                    onClick={onActionClick}
                >
                    {buttonText}
                </button>
                {disabled && disabledMessage && (
                    <p className="text-[10px] text-center text-brand-amber font-bold uppercase tracking-wider">
                        {disabledMessage}
                    </p>
                )}
            </div>
        </div>
    );
}
