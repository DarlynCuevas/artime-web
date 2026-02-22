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

  const pathname = router.pathname;
  const activeHref = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const isActive = (href: string) => activeHref === href;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/60 bg-white/80 backdrop-blur-xl md:hidden">
      <div className="flex items-center overflow-x-auto px-2 py-1 pb-safe">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-w-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 transition-all duration-200 ${active
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              <item.icon className={`transition-all duration-200 ${active ? 'h-5 w-5' : 'h-4.5 w-4.5'}`} />
              <span className={`text-[11px] font-semibold truncate transition-all duration-200 ${active ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
              {/* Dot indicator */}
              {active && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
