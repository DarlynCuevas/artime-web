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
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white md:hidden">
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-[90px] flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium ${
              isActive(item.href)
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
