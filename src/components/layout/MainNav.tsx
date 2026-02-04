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
import { Bell, CalendarDays, Compass, LayoutDashboard, Search, Ticket, UserRound, Users, Building2 } from 'lucide-react';

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
        { label: 'Buscar', href: '/venues/search', icon: Building2 },
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
        { label: 'Dashboard', href: '/artists/dashboard', icon: LayoutDashboard },
        { label: 'Bookings', href: '/bookings', icon: Ticket },
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
  const bellRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const navSections = useMemo(() => navByRole[role ?? ''] ?? [], [role]);

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
      if (!bellRef.current) return;
      if (bellRef.current.contains(evt.target as Node)) return;
      setShowDropdown(false);
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

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
            <div className="hidden text-sm text-muted-foreground md:block">
              {role ? `Rol: ${role}` : 'Sesión activa'}
            </div>
            <div className="relative ml-auto flex items-center gap-2" ref={bellRef}>
              <Button variant="ghost" size="icon" className="relative" onClick={() => setShowDropdown((s) => !s)}>
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">Abrir notificaciones</span>
              </Button>

              {showDropdown && (
                <div className="absolute right-4 top-14 w-80 rounded-lg border bg-popover p-3 text-sm shadow-lg">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">Notificaciones</span>
                    <span className="text-xs text-muted-foreground">Últimas 5</span>
                  </div>
                  {latestNotifications.length === 0 ? (
                    <p className="py-4 text-xs text-muted-foreground">Sin notificaciones</p>
                  ) : (
                    <div className="space-y-2">
                      {latestNotifications.map((n) => (
                        <button
                          key={n.id}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted"
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
                        >
                          <div className="text-sm font-semibold">
                            {n.type === 'ARTIST_CALL_CREATED'
                              ? 'Nueva convocatoria'
                              : n.type === 'EVENT_INVITATION_CREATED'
                                ? `${n.payload?.eventName ?? n.payload?.event?.name ?? 'Invitación a evento'}${n.payload?.eventName || n.payload?.event?.name ? ' te ha invitado a su evento' : ''}`
                                : n.type === 'EVENT_INVITATION_ACCEPTED'
                                  ? `${n.payload?.artistName ?? 'Un artista'} ha aceptado la invitación`
                                  : n.type === 'EVENT_INVITATION_DECLINED'
                                    ? `${n.payload?.artistName ?? 'Un artista'} ha rechazado la invitación`
                                  : n.type}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {n.type === 'EVENT_INVITATION_ACCEPTED' || n.type === 'EVENT_INVITATION_DECLINED'
                              ? n.payload?.eventName ?? ''
                              : `${n.payload?.venueName ? `${n.payload.venueName} · ` : ''}${n.payload?.city ?? ''}`}
                          </div>
                          <div className="text-xs text-foreground">
                            {n.payload?.date ?? ''}
                            {n.payload?.offeredMaxPrice ? ` · Oferta: €${n.payload?.offeredMaxPrice}` : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 w-full p-4">{children}</div>
        </SidebarInset>
      </div>
      <BottomNav items={mainSections.flatMap((section) => section.items)} />
    </SidebarProvider>
  );
}
