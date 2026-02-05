import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ComponentType } from 'react';

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export function BottomNav({ items }: { items: NavItem[] }) {
  const router = useRouter();

  const isActive = (href: string) =>
    router.pathname === href || router.pathname.startsWith(`${href}/`);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-safe">
      <div className="mx-4 mb-6 rounded-2xl border border-slate-200 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="flex items-center justify-around gap-1 px-2 py-2.5">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex flex-1 flex-col items-center justify-center gap-1.5 py-1 transition-all duration-300 ${
                  active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`flex size-10 items-center justify-center rounded-xl transition-all duration-300 ${
                  active ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-110' : 'bg-transparent'
                }`}>
                  <item.icon className={`size-5 transition-transform duration-300 ${active ? '' : 'group-hover:scale-110'}`} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                  active ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-1'
                }`}>
                  {item.label}
                </span>
                {active && (
                   <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-slate-900" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
