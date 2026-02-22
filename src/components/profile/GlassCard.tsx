import React, { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    title?: ReactNode;
    icon?: ReactNode;
    rightAction?: ReactNode;
    noPadding?: boolean;
}

export function GlassCard({
    children,
    className = '',
    title,
    icon,
    rightAction,
    noPadding = false,
}: GlassCardProps) {
    return (
        <section
            className={`bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${className}`}
        >
            {(title || icon || rightAction) && (
                <div className={`border-b border-slate-100 flex items-center justify-between bg-slate-50/50 ${noPadding ? 'p-6' : 'px-6 py-5'}`}>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5">
                        {icon && (
                            <span className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                {icon}
                            </span>
                        )}
                        {title}
                    </h2>
                    {rightAction && (
                        <div>
                            {rightAction}
                        </div>
                    )}
                </div>
            )}
            <div className={`${noPadding ? '' : 'p-6'}`}>
                {children}
            </div>
        </section>
    );
}
