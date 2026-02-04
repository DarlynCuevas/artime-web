'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { useArtistNotifications } from '@/hooks/artists/useArtistNotifications';
import { AlertCircle, Bell, CalendarDays, CheckCircle2, CircleDot, Compass, LayoutDashboard, Search, Settings, Ticket, UserRound, Users } from 'lucide-react';
import { supabase } from '@/services/supabase/supabaseClient';
import { formatCurrency } from '@/lib/utils';


type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navByRole: Record<string, NavSection[]> = {
  VENUE: [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard', href: '/venues/dashboard', icon: LayoutDashboard },
        { label: 'Bookings', href: '/venues/bookings', icon: Ticket },
        { label: 'Artistas', href: '/venues/discover', icon: Users },
        { label: 'Calendario', href: '/venues/calendar', icon: CalendarDays },
      ],
    },
    {
      label: 'Sistema',
      items: [{ label: 'Configuración', href: '/settings', icon: UserRound }],
    },
  ],
  ARTIST: [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard', href: '/artists/dashboard', icon: LayoutDashboard },
        { label: 'Calendario', href: '/artists/calendar', icon: CalendarDays },
        { label: 'Bookings', href: '/artists/bookings', icon: Ticket },
        { label: 'Perfil', href: '/artists', icon: Users },
      ],
    },
  ],
  MANAGER: [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
        { label: 'Artistas', href: '/manager/artists', icon: Users },
        { label: 'Perfil', href: '/manager/profile', icon: UserRound },
      ],
    },
  ],
  PROMOTER: [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard', href: '/promoter/dashboard', icon: LayoutDashboard },
        { label: 'Eventos', href: '/promoter/events', icon: CalendarDays },
        { label: 'Bookings', href: '/promoter/bookings', icon: Ticket },
        { label: 'Perfil', href: '/promoter/profile', icon: UserRound },
      ],
    },
  ],
};

export function MainNav({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { role, loading, profileId, profileName } = useMe();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const navSections = useMemo(() => navByRole[role ?? ''] ?? [], [role]);
  const [loggingOut, setLoggingOut] = useState(false);

  const navSectionsWithProfile = useMemo(() => {
    return navSections.map((section) => {
      if (role === 'VENUE' && section.label === 'Principal') {
        const venueProfileHref = '/venues/profile';
        return {
          ...section,
          items: [...section.items, { label: 'Perfil', href: venueProfileHref, icon: UserRound }],
        };
      }
      return section;
    });
  }, [navSections, role, profileId]);

  const mainSections = useMemo(() => navSectionsWithProfile.filter((section) => section.label !== 'Sistema'), [navSectionsWithProfile]);
  const systemSection = useMemo(() => navSectionsWithProfile.find((section) => section.label === 'Sistema'), [navSectionsWithProfile]);

  const { notifications, unreadCount, markAsRead } = useArtistNotifications({
    userId: user?.id,
    role: role ?? undefined,
    token: user?.token,
    limit: 5,
  });

  const latestNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);

  useEffect(() => {
    function handleClickOutside(evt: MouseEvent) {
      const target = evt.target as Node;
      if (bellRef.current && bellRef.current.contains(target)) return;
      if (userMenuRef.current && userMenuRef.current.contains(target)) return;
      setShowDropdown(false);
      setShowUserMenu(false);
    }

    if (showDropdown || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showUserMenu]);

  const isActive = (href: string) => router.pathname === href || router.pathname.startsWith(`${href}/`);

  if (!user || loading) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-screen bg-background text-foreground">
        <div className="hidden md:block">
        <Sidebar collapsible="icon">
          <SidebarHeader className="flex flex-row items-center gap-3 px-3 py-4 border-b border-sidebar-border/60 bg-[hsl(var(--sidebar-primary))]">
            <Image src="/favicon.ico" alt="Artime" width={32} height={32} className="h-8 w-8 shrink-0 rounded-md object-contain" priority />
            <div>
              <div className="text-sm font-semibold leading-tight text-[hsl(var(--sidebar-foreground))]">ARTIME</div>
              <div className="text-[11px] text-[hsl(var(--sidebar-foreground))]/70">Contratación artística</div>
            </div>
            <SidebarTrigger className="ml-auto hidden h-8 w-8 text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-foreground)_/_0.16)] md:inline-flex" />
          </SidebarHeader>
          


          <SidebarContent className="px-2 py-3 bg-[hsl(var(--sidebar-primary))]">
            <div className="space-y-2">
              {mainSections.map((section) => (
                <SidebarGroup key={section.label} className="px-2">
                  <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[0.08em] text-[hsl(var(--sidebar-foreground))]">
                    {section.label}
                  </SidebarGroupLabel>
                  <SidebarMenu className="mt-1 space-y-1">
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.href)}
                          className="group h-10 rounded-lg px-3 text-[15px] font-medium text-[hsl(var(--sidebar-foreground))]/70 transition-colors hover:bg-[hsl(var(--sidebar-foreground)_/_0.12)] data-[active=true]:bg-[hsl(var(--sidebar-foreground)_/_0.18)]"
                        >
                          <Link href={item.href} className="flex items-center gap-3">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-foreground)_/_0.14)] text-[hsl(var(--sidebar-foreground))] transition-colors group-data-[active=true]:bg-[hsl(var(--sidebar-foreground)_/_0.22)]">
                              <item.icon className="size-4" />
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
            </div>

            <div className="flex-1" />

            {systemSection ? (
              <SidebarGroup key={systemSection.label} className="px-2 pt-2">
                <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[0.08em] text-[hsl(var(--sidebar-foreground))]">
                  {systemSection.label}
                </SidebarGroupLabel>
                <SidebarMenu className="mt-1 space-y-1">
                  {systemSection.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        className="group h-10 rounded-lg px-3 text-[15px] font-medium text-[hsl(var(--sidebar-foreground))]/70 transition-colors hover:bg-[hsl(var(--sidebar-foreground)_/_0.12)] data-[active=true]:bg-[hsl(var(--sidebar-foreground)_/_0.18)]"
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-foreground)_/_0.14)] text-[hsl(var(--sidebar-foreground))] transition-colors group-data-[active=true]:bg-[hsl(var(--sidebar-foreground)_/_0.22)]">
                            <item.icon className="size-4" />
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ) : null}
          </SidebarContent>

          <SidebarSeparator className="mx-3 bg-sidebar-border/60" />

          <SidebarFooter className="p-3 pt-2 bg-[hsl(var(--sidebar-primary))] ">
            <div className="text-sm font-semibold leading-tight text-[hsl(var(--sidebar-foreground))]">{profileName ?? 'Usuario'}</div>
            <div className="text-[11px] text-sidebar-muted text-[hsl(var(--sidebar-foreground))]">{role ?? 'Sin rol'}</div>
          </SidebarFooter>
          <SidebarRail className="bg-[hsl(var(--sidebar-primary))]/70 after:bg-[hsl(var(--sidebar-foreground))]/30 hover:after:bg-[hsl(var(--sidebar-foreground))]/60" />
        </Sidebar>
        </div>

        <SidebarInset className="flex-1 w-full pb-16 md:pb-0">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur">
            <SidebarTrigger className="hidden h-8 w-8 text-slate-700 hover:bg-slate-200/60 md:inline-flex" />
            <Separator orientation="vertical" className="hidden h-6 md:block" />
            <div className="flex items-center gap-2 md:hidden">
              <Image src="/favicon.ico" alt="Artime" width={28} height={28} className="h-7 w-7 rounded-md" />
              <span className="text-sm font-semibold text-foreground">ARTIME</span>
            </div>
            <RoleBadge role={role} profileName={profileName} />
            <div className="relative ml-auto flex items-center gap-2">
              <Button
                ref={bellRef}
                variant="ghost"
                size="icon"
                className="relative rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50"
                onClick={() => setShowDropdown((s) => !s)}
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">Abrir notificaciones</span>
              </Button>

              {showDropdown && (
                <div className="absolute right-0 top-14 w-[360px] rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xl ring-1 ring-slate-200/80">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Centro de alertas</p>
                      <p className="text-base font-semibold text-slate-900">Notificaciones</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{unreadCount} nuevas</span>
                      <button
                        type="button"
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:text-slate-400"
                        disabled={markingAll || unreadCount === 0}
                        onClick={async () => {
                          if (unreadCount === 0) return;
                          setMarkingAll(true);
                          try {
                            const unread = latestNotifications.filter((n) => n.status === 'UNREAD');
                            await Promise.all(unread.map((n) => markAsRead(n.id)));
                          } finally {
                            setMarkingAll(false);
                          }
                        }}
                      >
                        Marcar todo leído
                      </button>
                    </div>
                  </div>
                  {latestNotifications.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-slate-500">
                      <p className="text-sm font-semibold">Sin notificaciones</p>
                      <p className="text-xs text-slate-500">Te avisaremos cuando llegue algo nuevo.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {latestNotifications.map((n) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onClick={async () => {
                            if (n.status === 'UNREAD') {
                              await markAsRead(n.id);
                            }
                            const callId = n.payload?.callId;
                            if (callId) {
                              const query = new URLSearchParams();
                              if (n.payload?.city) query.set('city', n.payload.city);
                              if (n.payload?.date) query.set('date', n.payload.date);
                              if (n.payload?.offeredMaxPrice) query.set('price', String(n.payload.offeredMaxPrice));
                              if (n.payload?.venueName) query.set('venueName', n.payload.venueName);
                              router.push(`/artists/calls/${callId}?${query.toString()}`);
                              setShowDropdown(false);
                              return;
                            }

                            const invitationId = n.payload?.invitationId;
                            const eventId = n.payload?.eventId;
                            if (n.type === 'EVENT_INVITATION_ACCEPTED' || n.type === 'EVENT_INVITATION_DECLINED') {
                              if (eventId) {
                                router.push(`/events/${eventId}#event-invitations`);
                                setShowDropdown(false);
                                return;
                              }
                            }

                            if (invitationId) {
                              router.push(`/artists/bookings/invitations?invitationId=${invitationId}`);
                              setShowDropdown(false);
                              return;
                            }
                            setShowDropdown(false);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setShowUserMenu((s) => !s)}
                >
                  <Settings className="size-5" />
                  <span className="sr-only">Abrir menú de usuario</span>
                </Button>

                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-48 rounded-lg border bg-popover p-2 text-sm shadow-lg">
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Ajustes
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted"
                      onClick={async () => {
                        if (loggingOut) return;
                        setLoggingOut(true);
                        try {
                          await supabase.auth.signOut();
                          router.push('/login');
                        } finally {
                          setLoggingOut(false);
                          setShowUserMenu(false);
                        }
                      }}
                      disabled={loggingOut}
                    >
                      {loggingOut ? 'Cerrando…' : 'Cerrar sesión'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 w-full p-4">{children}</div>
        </SidebarInset>
      </div>
      <BottomNav items={mainSections.flatMap((section) => section.items)} />
    </SidebarProvider>
  );
}

function RoleBadge({ role, profileName }: { role?: string | null; profileName?: string | null }) {
  if (!role) return null;
  return (
    <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm md:inline-flex">
      <CircleDot className="h-3.5 w-3.5 text-slate-500" />
      <span>{role}</span>
      {profileName && <span className="text-slate-400">·</span>}
      {profileName && <span className="text-slate-600">{profileName}</span>}
    </div>
  );
}

function NotificationItem({ notification, onClick }: { notification: any; onClick: () => void }) {
  const isUnread = notification.status === 'UNREAD';
  const requesterName = notification.payload?.eventName ?? notification.payload?.venueName;
  const title =
    notification.type === 'ARTIST_CALL_CREATED'
      ? 'Nueva convocatoria'
      : notification.type === 'EVENT_INVITATION_CREATED'
        ? `${notification.payload?.eventName ?? notification.payload?.event?.name ?? 'Invitación a evento'}${notification.payload?.eventName || notification.payload?.event?.name ? ' te ha invitado a su evento' : ''}`
        : notification.type === 'EVENT_INVITATION_ACCEPTED'
          ? `${notification.payload?.artistName ?? 'Un artista'} ha aceptado la invitación`
          : notification.type === 'EVENT_INVITATION_DECLINED'
            ? `${notification.payload?.artistName ?? 'Un artista'} ha rechazado la invitación`
            : notification.type === 'BOOKING_REQUEST'
              ? `${requesterName ?? 'Un organizador'} te ha enviado una solicitud de contratación`
              : notification.type === 'REPRESENTATION_REQUEST_CREATED'
                ? 'Solicitud de representación'
                : notification.type === 'REPRESENTATION_REQUEST_RESOLVED'
                  ? `Respuesta a tu solicitud: ${notification.payload?.result ?? ''}`
                  : notification.type;

  const location =
    notification.type === 'EVENT_INVITATION_ACCEPTED' || notification.type === 'EVENT_INVITATION_DECLINED'
      ? notification.payload?.eventName ?? ''
      : notification.type === 'BOOKING_REQUEST'
        ? `${notification.payload?.eventName ?? notification.payload?.venueName ?? ''}`
        : notification.type === 'REPRESENTATION_REQUEST_CREATED'
          ? `${notification.payload?.managerName ?? 'Manager'} propone ${notification.payload?.commissionPercentage ?? '—'}%`
          : `${notification.payload?.venueName ? `${notification.payload.venueName} · ` : ''}${notification.payload?.city ?? ''}`;

  const budget = (() => {
    const minP = notification.payload?.offeredMinPrice;
    const maxP = notification.payload?.offeredMaxPrice;
    if (minP && maxP) return `Presupuesto: ${formatCurrency(minP, 'EUR')} - ${formatCurrency(maxP, 'EUR')}`;
    if (maxP) return `Presupuesto hasta ${formatCurrency(maxP, 'EUR')}`;
    if (minP) return `Presupuesto desde ${formatCurrency(minP, 'EUR')}`;
    return '';
  })();

  return (
    <button
      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
        isUnread
          ? 'border-slate-300 bg-slate-50 hover:border-slate-400'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {notification.type === 'EVENT_INVITATION_ACCEPTED' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : notification.type === 'EVENT_INVITATION_DECLINED' ? (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            ) : (
              <Bell className="h-4 w-4 text-slate-500" />
            )}
            <span className="text-sm font-semibold text-slate-900">{title}</span>
          </div>
          <p className="text-xs text-slate-600">{location}</p>
          <p className="text-xs text-slate-500">
            {notification.payload?.date ?? ''}
            {budget ? ` · ${budget}` : ''}
          </p>
        </div>
        {isUnread && <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />}
      </div>
    </button>
  );
}
