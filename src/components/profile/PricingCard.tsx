import React from 'react';

interface PricingCardProps {
    amount: number;
    currency: string;
    isNegotiable: boolean;
    buttonText?: string;
    onActionClick?: () => void;
    actionDisabled?: boolean;
    className?: string;
}

export function PricingCard({
    amount,
    currency,
    isNegotiable,
    buttonText = 'Solicitar Fecha',
    onActionClick,
    actionDisabled = false,
    className = '',
}: PricingCardProps) {
    return (
        <div className={`bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-col shadow-2xl ${className}`}>
            {/* Upper part: Price */}
            <div className="flex flex-col mb-4 items-center text-center">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    Caché Base
                </span>
                <div className="flex items-baseline gap-1 justify-center">
                    <span className="text-4xl font-black text-white tabular-nums tracking-tighter leading-none">
                        {amount.toLocaleString('es-ES')}
                    </span>
                    <span className="text-xl font-bold text-slate-500 leading-none">{currency}</span>
                </div>
                <span className="text-brand-amber text-xs mt-2 font-bold uppercase tracking-wider">
                    {isNegotiable ? 'Negociable' : 'No Negociable'}
                </span>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-slate-700/50 mb-4" />

            {/* Lower part: Action */}
            <button
                disabled={actionDisabled}
                className={`w-full h-11 rounded-xl font-bold text-sm transition-all duration-200 ${
                    actionDisabled
                        ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                        : 'bg-brand-amber hover:bg-amber-400 text-amber-950 shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.23)] hover:-translate-y-0.5'
                }`}
                onClick={onActionClick}
            >
                {buttonText}
            </button>
        </div>
    );
}
