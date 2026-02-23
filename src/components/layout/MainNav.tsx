import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Shield,
  BadgeCheck,
  Building2,
  Bell,
  BellRing,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileSignature,
  HandCoins,
  LayoutDashboard,
  Inbox,
  MessageSquare,
  PartyPopper,
  Settings,
  Sparkles,
  Ticket,
  UserRound,
  Users,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { useArtistNotifications } from '@/hooks/artists/useArtistNotifications';
import type { ArtistNotification } from '@/services/notifications/artist-notifications.service';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/services/supabase/supabaseClient';

const navByRole: Record<
  string,
  {
    main: { label: string; href: string; icon: LucideIcon }[];
    account: { label: string; href: string; icon: LucideIcon }[];
  }
> = {
  VENUE: {
    main: [
      { label: 'Dashboard', href: '/venues/dashboard', icon: LayoutDashboard },
      { label: 'Bookings', href: '/venues/bookings', icon: Ticket },
      { label: 'Sugerencias', href: '/venues/suggestions', icon: Inbox },
      { label: 'Artistas', href: '/venues/discover', icon: Users },
      { label: 'Perfil', href: '/venues/profile', icon: UserRound },
    ],
    account: [{ label: 'Configuración', href: '/settings', icon: UserRound }],
  },
  ARTIST: {
    main: [
      { label: 'Dashboard', href: '/artists/dashboard', icon: LayoutDashboard },
      { label: 'Bookings', href: '/artists/bookings', icon: Ticket },
      { label: 'Calendario', href: '/artists/calendar', icon: CalendarDays },
      { label: 'Perfil', href: '/artists', icon: Users },
    ],
    account: [{ label: 'Configuración', href: '/settings', icon: UserRound }],
  },
  MANAGER: {
    main: [
      { label: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
      { label: 'Bookings', href: '/manager/bookings', icon: Ticket },
      { label: 'Artistas', href: '/manager/artists', icon: Users },
      { label: 'Salas', href: '/manager/venues', icon: Building2 },
      { label: 'Calendario', href: '/manager/calendar', icon: CalendarDays },
      { label: 'Perfil', href: '/manager/profile', icon: UserRound },
    ],
    account: [{ label: 'Configuración', href: '/settings', icon: UserRound }],
  },
  PROMOTER: {
    main: [
      { label: 'Dashboard', href: '/promoter/dashboard', icon: LayoutDashboard },
      { label: 'Bookings', href: '/promoter/bookings', icon: Ticket },
      { label: 'Events', href: '/promoter/events', icon: CalendarDays },
      { label: 'Perfil', href: '/promoter/profile', icon: UserRound },
    ],
    account: [{ label: 'Configuración', href: '/settings', icon: UserRound }],
  },
  '': {
    main: [
      { label: 'Explorar Salas', href: '/venues/discover', icon: Users },
      { label: 'Explorar Artistas', href: '/artists/discover', icon: Sparkles },
    ],
    account: [{ label: 'Iniciar Sesión', href: '/login', icon: UserRound }],
  },
};

export function MainNav({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { role, loading, profileName, isAdmin } = useMe();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileSwipeX, setMobileSwipeX] = useState(0);
  const [mobileSwipeActive, setMobileSwipeActive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const lastToastIdRef = useRef<string | null>(null);
  const hasBootstrappedToasts = useRef(false);
  const mobileTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const router = useRouter();

  const navSections = useMemo(() => navByRole[role ?? ''], [role]);
  const navSectionsWithProfile = useMemo(() => {
    if (!navSections) return null;
    const account = isAdmin
      ? [...navSections.account, { label: 'Admin', href: '/admin/verifications', icon: Shield }]
      : navSections.account;
    return {
      main: navSections.main,
      account,
    };
  }, [navSections, isAdmin]);

  const { notifications: latestNotifications = [], unreadCount, markAsRead } = useArtistNotifications({
    userId: user?.id,
    token: user?.token,
    role: role || undefined,
    limit: 20,
  });

  useEffect(() => {
    if (!latestNotifications.length) return;

    if (!hasBootstrappedToasts.current) {
      hasBootstrappedToasts.current = true;
      lastToastIdRef.current = latestNotifications[0]?.id ?? null;
      return;
    }

    const latest = latestNotifications[0];
    if (!latest || latest.id === lastToastIdRef.current) return;
    lastToastIdRef.current = latest.id;

    const bookingId = latest.payload?.bookingId ?? latest.payload?.booking_id;
    let href: string | undefined;
    if (bookingId) {
      if (role === 'MANAGER') {
        href = `/bookings/${bookingId}`;
      } else {
        const base =
          role === 'VENUE'
            ? '/venues/bookings'
            : role === 'PROMOTER'
              ? '/promoter/bookings'
              : '/artists/bookings';
        href = `${base}?bookingId=${bookingId}`;
      }
    }

    const actorName =
      latest.payload?.actorName ||
      latest.payload?.eventName ||
      latest.payload?.venueName ||
      latest.payload?.promoterName ||
      latest.payload?.artistName ||
      'Una parte';

    const eventName = latest.payload?.eventName;
    const date = latest.payload?.date;
    const contextText = eventName ? ` para ${eventName}` : date ? ` para el ${date}` : '';

    if (latest.type === 'BOOKING_REQUEST') {
      toast({
        title: 'Nueva solicitud de contratación',
        description: `${actorName} te ha enviado una solicitud de contratación${contextText}.`,
        href,
      });
    }

    if (latest.type === 'NEGOTIATION_MESSAGE_SENT') {
      toast({
        title: 'Nueva contraoferta',
        description: `${actorName} ha enviado una nueva propuesta${contextText}.`,
        href,
      });
    }

    if (latest.type === 'FINAL_OFFER_SENT') {
      toast({
        title: 'Oferta final enviada',
        description: `${actorName} ha enviado una oferta final${contextText}.`,
        href,
      });
    }

    if (latest.type === 'BOOKING_ACCEPTED') {
      toast({
        title: 'Contratación aceptada',
        description: `${actorName} ha aceptado la contratación${contextText}.`,
        href,
      });
    }

    if (latest.type === 'BOOKING_REJECTED') {
      toast({
        title: 'Contratación rechazada',
        description: `${actorName} ha rechazado la contratación${contextText}.`,
        href,
      });
    }

    if (latest.type === 'BOOKING_CANCELLED') {
      toast({
        title: 'Booking cancelado',
        description: `${actorName} ha cancelado el booking${contextText}.`,
        href,
      });
    }

    if (latest.type === 'CONTRACT_SIGNED') {
      toast({
        title: 'Contrato firmado',
        description: `${actorName} ha firmado el contrato${contextText}.`,
        href,
      });
    }

    if (latest.type === 'PAYMENT_CONFIRMED') {
      const paymentStatus = latest.payload?.paymentStatus;
      const paymentLabel = paymentStatus === 'FULL' ? 'pago final' : 'pago parcial';
      toast({
        title: 'Pago confirmado',
        description: `${actorName} ha confirmado un ${paymentLabel}${contextText}.`,
        href,
      });
    }

    if (latest.type === 'EVENT_INVITATION_CREATED') {
      const eventName = latest.payload?.eventName;
      toast({
        title: 'Invitación a evento',
        description: `Has recibido una invitación${eventName ? ` para ${eventName}` : ''}.`,
        href: latest.payload?.invitationId
          ? `/artists/bookings/invitations?invitationId=${latest.payload.invitationId}`
          : '/artists/bookings/invitations',
      });
    }

    if (latest.type === 'EVENT_INVITATION_ACCEPTED') {
      const artistName = latest.payload?.artistName ?? 'Un artista';
      const eventName = latest.payload?.eventName;
      toast({
        title: 'Invitación aceptada',
        description: `${artistName} ha aceptado la invitación${eventName ? ` para ${eventName}` : ''}.`,
        href: latest.payload?.eventId ? `/events/${latest.payload.eventId}#event-invitations` : '/events',
      });
    }

    if (latest.type === 'EVENT_INVITATION_DECLINED') {
      const artistName = latest.payload?.artistName ?? 'Un artista';
      const eventName = latest.payload?.eventName;
      toast({
        title: 'Invitación rechazada',
        description: `${artistName} ha rechazado la invitación${eventName ? ` para ${eventName}` : ''}.`,
        href: latest.payload?.eventId ? `/events/${latest.payload.eventId}#event-invitations` : '/events',
      });
    }

    if (latest.type === 'VENUE_ARTIST_SUGGESTION_CREATED') {
      toast({
        title: 'Nueva sugerencia recibida',
        description: `${latest.payload?.managerName ?? 'Un manager'} te sugiere a ${latest.payload?.artistName ?? 'un artista'}.`,
        href: latest.payload?.suggestionId
          ? `/venues/suggestions?suggestionId=${latest.payload.suggestionId}`
          : '/venues/suggestions',
      });
    }

    if (latest.type === 'VENUE_ARTIST_SUGGESTION_RESOLVED') {
      toast({
        title: 'Sugerencia actualizada',
        description: `${latest.payload?.venueName ?? 'Una sala'} ha marcado la sugerencia de ${latest.payload?.artistName ?? 'un artista'} como ${latest.payload?.status ?? 'actualizada'}.`,
        href: '/manager/venues',
      });
    }
  }, [latestNotifications]);

  const mainItems = navSectionsWithProfile?.main ?? [];
  const accountItems = navSectionsWithProfile?.account ?? [];
  const primaryItems = mainItems.filter((item) => item.label !== 'Perfil');
  const profileItem = mainItems.find((item) => item.label === 'Perfil');

  const exactMatchRoutes = new Set([
    '/artists',
    '/venues',
    '/manager/profile',
    '/promoter/profile',
  ]);

  const isActive = (href: string) => {
    if (exactMatchRoutes.has(href)) {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  const headerMeta = getHeaderMeta(router.pathname, role);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showDropdown && bellRef.current && !bellRef.current.contains(target) && (!dropdownRef.current || !dropdownRef.current.contains(target))) {
        setShowDropdown(false);
      }
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown, showUserMenu]);

  useEffect(() => {
    if (!showDropdown) {
      mobileTouchStartRef.current = null;
      setMobileSwipeX(0);
      setMobileSwipeActive(false);
    }
  }, [showDropdown]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (loading) return null;

  return (
    <SidebarProvider>
      <Sidebar className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
        <SidebarHeader className="flex items-center px-4 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-black tracking-tight text-slate-900">
                Art<span className="text-brand-amber">·</span>ime
              </span>
              <span className="text-[9px] font-semibold tracking-[0.22em] text-slate-400 uppercase">Music Platform</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-[hsl(var(--sidebar-background))] px-2 py-2">
          <nav className="px-2">
            <ul className="flex flex-col gap-1">
              {primaryItems.map((item) => (
                <li key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className="group h-9 rounded-md px-3 text-[14px] font-medium text-slate-600 transition-all hover:bg-amber-50 hover:text-amber-700 data-[active=true]:bg-gradient-to-r data-[active=true]:from-amber-50 data-[active=true]:to-transparent data-[active=true]:text-amber-700 data-[active=true]:border-l-2 data-[active=true]:border-amber-500"
                  >
                    <Link href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className="flex items-center gap-3">
                      <item.icon className="size-4 text-slate-400 group-data-[active=true]:text-amber-600" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </li>
              ))}

              {profileItem && (
                <li key={profileItem.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(profileItem.href)}
                    className="group h-9 rounded-md px-3 text-[14px] font-medium text-slate-600 transition-all hover:bg-amber-50 hover:text-amber-700 data-[active=true]:bg-gradient-to-r data-[active=true]:from-amber-50 data-[active=true]:to-transparent data-[active=true]:text-amber-700 data-[active=true]:border-l-2 data-[active=true]:border-amber-500"
                  >
                    <Link
                      href={profileItem.href}
                      aria-current={isActive(profileItem.href) ? 'page' : undefined}
                      className="flex items-center gap-3"
                    >
                      <profileItem.icon className="size-4 text-slate-400 group-data-[active=true]:text-slate-700" />
                      <span>{profileItem.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </li>
              )}

              {accountItems.length > 0 && (
                <>
                  <li>
                    <SidebarSeparator className="my-3 bg-sidebar-border/60" />
                  </li>
                  {accountItems.map((item) => (
                    <li key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        className="group h-9 rounded-md px-3 text-[14px] font-medium text-slate-600 transition-all hover:bg-amber-50 hover:text-amber-700 data-[active=true]:bg-gradient-to-r data-[active=true]:from-amber-50 data-[active=true]:to-transparent data-[active=true]:text-amber-700 data-[active=true]:border-l-2 data-[active=true]:border-amber-500"
                      >
                        <Link href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className="flex items-center gap-3">
                          <item.icon className="size-4 text-slate-400 group-data-[active=true]:text-amber-600" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </nav>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="w-full flex-1 pb-16 md:pb-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl px-6 py-4 shadow-[0_1px_0_rgb(0,0,0,0.04)]">
          <SidebarTrigger className="hidden h-9 w-9 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 md:inline-flex" />
          <div className="flex flex-col border-l-2 border-brand-amber pl-3">
            <span className="text-lg font-semibold text-slate-900">{headerMeta.title}</span>
            {headerMeta.subtitle && <span className="text-xs text-slate-500">{headerMeta.subtitle}</span>}
          </div>
          <div className="relative ml-auto flex items-center gap-3">
            <Button
              ref={bellRef}
              variant="ghost"
              size="icon"
              className="relative rounded-md border border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50 hover:border-brand-amber/40 transition-colors"
              onClick={() => setShowDropdown((s) => !s)}
            >
              {unreadCount > 0 ? <BellRing className="size-5 text-brand-amber" /> : <Bell className="size-5" />}
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-brand-amber px-1 text-[10px] font-semibold text-amber-950">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Abrir notificaciones</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="relative flex items-center gap-3" ref={userMenuRef}>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-xs font-bold text-white shadow-sm hover:from-amber-500 hover:to-amber-600 transition-all"
                onClick={() => setShowUserMenu((s) => !s)}
              >
                {(profileName ?? 'U').slice(0, 1).toUpperCase()}
                <span className="sr-only">Abrir menú de usuario</span>
              </button>
              <div className="text-sm leading-tight">
                <div className="font-semibold text-slate-900">{profileName ?? 'Usuario'}</div>
                <div className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">{role ?? 'Sin rol'}</div>
              </div>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-44 rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-lg">
                  <Link
                    href="/settings"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-slate-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    Configuración
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-slate-50"
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

            {showDropdown && isMounted && createPortal(
              <div className="fixed inset-0 z-[999] bg-white sm:inset-auto sm:right-6 sm:top-20 sm:w-[400px] sm:rounded-3xl sm:border sm:border-slate-200/80 sm:bg-white/95 sm:shadow-2xl sm:backdrop-blur-xl sm:ring-1 sm:ring-slate-900/5">
                <div
                  ref={dropdownRef}
                  className="h-full w-full sm:h-auto"
                  onTouchStart={(e) => {
                    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches) return;
                    const t = e.touches[0];
                    if (!t) return;
                    mobileTouchStartRef.current = { x: t.clientX, y: t.clientY };
                    setMobileSwipeActive(true);
                    setMobileSwipeX(0);
                  }}
                  onTouchMove={(e) => {
                    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches) return;
                    const start = mobileTouchStartRef.current;
                    const t = e.touches[0];
                    if (!start || !t) return;
                    const dx = t.clientX - start.x;
                    const dy = t.clientY - start.y;
                    if (Math.abs(dy) > Math.abs(dx) + 12) {
                      mobileTouchStartRef.current = null;
                      setMobileSwipeActive(false);
                      setMobileSwipeX(0);
                      return;
                    }
                    if (dx > 0) setMobileSwipeX(Math.min(dx, 360));
                  }}
                  onTouchEnd={() => {
                    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches) return;
                    const shouldClose = mobileSwipeX > 90;
                    mobileTouchStartRef.current = null;
                    setMobileSwipeActive(false);
                    if (shouldClose) setShowDropdown(false);
                    setMobileSwipeX(0);
                  }}
                  onTouchCancel={() => {
                    mobileTouchStartRef.current = null;
                    setMobileSwipeActive(false);
                    setMobileSwipeX(0);
                  }}
                  style={{
                    transform: mobileSwipeX ? `translateX(${mobileSwipeX}px)` : undefined,
                    transition: mobileSwipeActive ? 'none' : 'transform 180ms ease-out',
                    willChange: mobileSwipeActive ? 'transform' : undefined,
                  }}
                >
                  <div className="flex h-full flex-col sm:h-auto">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => setShowDropdown(false)}
                          className="sm:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 active:bg-slate-50"
                        >
                          <span aria-hidden="true" className="text-lg leading-none">&lt;</span>
                          <span className="sr-only">Volver</span>
                        </button>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
                          <Bell className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Centro de alertas</p>
                          <p className="text-base font-black text-slate-900 leading-none truncate">Notificaciones</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 text-[11px] font-black text-amber-700">
                            {unreadCount}
                          </span>
                        )}
                        <button
                          type="button"
                          className="text-xs font-bold text-slate-500 hover:text-amber-600 disabled:opacity-40 transition-colors"
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
                        <button
                          type="button"
                          onClick={() => setShowDropdown(false)}
                          className="hidden sm:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto sm:max-h-[480px]">
                      {latestNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-14 px-6 text-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <Bell className="h-8 w-8 text-slate-300" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-700">Todo al día</p>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">Te avisaremos cuando llegue algo nuevo.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50 px-2 py-2">
                          {latestNotifications.map((n) => (
                            <NotificationItem
                              key={n.id}
                              notification={n}
                              onClick={async () => {
                                try {
                                  if (n.status === 'UNREAD') {
                                    try {
                                      await markAsRead(n.id);
                                    } catch (e) {
                                      // no bloquear navegación por error de backend
                                    }
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

                                  if (n.type === 'REPRESENTATION_REQUEST_CREATED') {
                                    const repRequestId =
                                      n.payload?.requestId ||
                                      n.payload?.request_id ||
                                      n.payload?.id;

                                    const path = repRequestId
                                      ? `/artists/representation-requests/${repRequestId}`
                                      : '/artists/representation-requests';

                                    const qs = new URLSearchParams();
                                    const mgrName = n.payload?.managerName || n.payload?.manager_name;
                                    const commission = n.payload?.commissionPercentage || n.payload?.commission_percentage;
                                    if (mgrName) qs.set('managerName', mgrName);
                                    if (commission) qs.set('commission', String(commission));
                                    const suffix = qs.toString();

                                    router.push(`${path}${suffix ? `?${suffix}` : ''}`);
                                    setShowDropdown(false);
                                    return;
                                  }

                                  if (n.type === 'REPRESENTATION_REQUEST_RESOLVED') {
                                    const target = role === 'MANAGER' ? '/manager/artists' : '/artists/representation-requests';
                                    router.push(target);
                                    setShowDropdown(false);
                                    return;
                                  }

                                  const bookingTypes = new Set([
                                    'BOOKING_REQUEST',
                                    'NEGOTIATION_MESSAGE_SENT',
                                    'FINAL_OFFER_SENT',
                                    'BOOKING_ACCEPTED',
                                    'BOOKING_REJECTED',
                                    'BOOKING_CANCELLED',
                                    'CONTRACT_SIGNED',
                                    'PAYMENT_CONFIRMED',
                                  ]);

                                  if (bookingTypes.has(n.type)) {
                                    const bookingId = n.payload?.bookingId ?? n.payload?.booking_id;
                                    const target = getBookingTarget({ role, bookingId });
                                    router.push(target);
                                    setShowDropdown(false);
                                    return;
                                  }

                                  if (n.type === 'VENUE_ARTIST_SUGGESTION_CREATED') {
                                    const suggestionId = n.payload?.suggestionId;
                                    const target = suggestionId
                                      ? `/venues/suggestions?suggestionId=${suggestionId}`
                                      : '/venues/suggestions';
                                    router.push(target);
                                    setShowDropdown(false);
                                    return;
                                  }

                                  if (n.type === 'VENUE_ARTIST_SUGGESTION_RESOLVED') {
                                    router.push('/manager/venues');
                                    setShowDropdown(false);
                                    return;
                                  }

                                  if (n.type === 'EVENT_INVITATION_CREATED') {
                                    const eventId = n.payload?.eventId || n.payload?.event_id;
                                    const invitationId = n.payload?.invitationId || n.payload?.invitation_id;
                                    const target = invitationId
                                      ? `/artists/bookings/invitations?invitationId=${invitationId}`
                                      : eventId
                                        ? `/events/${eventId}#event-invitations`
                                        : '/artists/bookings/invitations';
                                    router.push(target);
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
                                } catch (e) {
                                  setShowDropdown(false);
                                }
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 px-5 py-3">
                      <Link
                        href="/settings?tab=notifications"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Preferencias de notificación
                      </Link>
                    </div>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          </div>
        </header>

        <div className="w-full flex-1 px-6 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </div>
      </SidebarInset>

      <BottomNav items={mainItems} />
    </SidebarProvider>
  );
}

function getHeaderMeta(pathname: string, role?: string | null) {
  const base = pathname.split('?')[0];
  if (base.includes('/dashboard')) {
    return { title: 'Dashboard', subtitle: role === 'ARTIST' ? 'Control operativo del artista' : 'Resumen operativo' };
  }
  if (base.includes('/bookings')) {
    return { title: 'Bookings', subtitle: 'Contrataciones en curso' };
  }
  if (base.includes('/suggestions')) {
    return { title: 'Sugerencias', subtitle: 'Bandeja de propuestas de artistas' };
  }
  if (base.includes('/calendar')) {
    return { title: 'Calendario', subtitle: 'Disponibilidad y fechas' };
  }
  if (base.includes('/events')) {
    return { title: 'Calendario', subtitle: 'Eventos y convocatorias' };
  }
  if (base.includes('/profile') || base === '/artists' || base === '/venues' || base === '/manager/profile' || base === '/promoter/profile') {
    return { title: 'Perfil', subtitle: 'Configuración profesional' };
  }
  return { title: 'Panel', subtitle: '' };
}

// ─── Notification type config ────────────────────────────────────────────────
const NOTIFICATION_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  BOOKING_REQUEST: { icon: <Ticket className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Solicitud de contratación' },
  NEGOTIATION_MESSAGE_SENT: { icon: <MessageSquare className="h-4 w-4" />, color: 'text-violet-600', bg: 'bg-violet-100', label: 'Nueva contraoferta' },
  FINAL_OFFER_SENT: { icon: <HandCoins className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Oferta final' },
  BOOKING_ACCEPTED: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Contratación aceptada' },
  BOOKING_REJECTED: { icon: <XCircle className="h-4 w-4" />, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Contratación rechazada' },
  BOOKING_CANCELLED: { icon: <XCircle className="h-4 w-4" />, color: 'text-rose-500', bg: 'bg-rose-100', label: 'Booking cancelado' },
  CONTRACT_SIGNED: { icon: <FileSignature className="h-4 w-4" />, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Contrato firmado' },
  PAYMENT_CONFIRMED: { icon: <Banknote className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Pago confirmado' },
  EVENT_INVITATION_CREATED: { icon: <PartyPopper className="h-4 w-4" />, color: 'text-pink-600', bg: 'bg-pink-100', label: 'Invitación a evento' },
  EVENT_INVITATION_ACCEPTED: { icon: <BadgeCheck className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Invitación aceptada' },
  EVENT_INVITATION_DECLINED: { icon: <AlertCircle className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Invitación rechazada' },
  ARTIST_CALL_CREATED: { icon: <Sparkles className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Nueva convocatoria' },
  REPRESENTATION_REQUEST_CREATED: { icon: <Users className="h-4 w-4" />, color: 'text-violet-600', bg: 'bg-violet-100', label: 'Solicitud de representación' },
  REPRESENTATION_REQUEST_RESOLVED: { icon: <BadgeCheck className="h-4 w-4" />, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Respuesta a solicitud' },
  VENUE_ARTIST_SUGGESTION_CREATED: { icon: <Inbox className="h-4 w-4" />, color: 'text-amber-700', bg: 'bg-amber-100', label: 'Nueva sugerencia' },
  VENUE_ARTIST_SUGGESTION_RESOLVED: { icon: <BadgeCheck className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Sugerencia resuelta' },
};

const DEFAULT_CONFIG = { icon: <Bell className="h-4 w-4" />, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Notificación' };

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function NotificationItem({ notification, onClick }: { notification: ArtistNotification; onClick: () => void }) {
  const isUnread = notification.status === 'UNREAD';
  const config = NOTIFICATION_CONFIG[notification.type] ?? DEFAULT_CONFIG;

  // ─── Title ────────────────────────────────────────────────────────────────
  const title = (() => {
    const p = notification.payload ?? {};
    const actor = p.actorName ?? p.venueName ?? p.artistName ?? p.managerName ?? p.promoterName ?? p.eventName ?? 'Alguien';
    switch (notification.type) {
      case 'BOOKING_REQUEST': return `${p.venueName ?? p.eventName ?? actor} te ha enviado una solicitud`;
      case 'NEGOTIATION_MESSAGE_SENT': return `${actor} ha enviado una nueva propuesta`;
      case 'FINAL_OFFER_SENT': return `${actor} ha enviado una oferta final`;
      case 'BOOKING_ACCEPTED': return `${actor} ha aceptado la contratación`;
      case 'BOOKING_REJECTED': return `${actor} ha rechazado la contratación`;
      case 'BOOKING_CANCELLED': return `${actor} ha cancelado el booking`;
      case 'CONTRACT_SIGNED': return `${actor} ha firmado el contrato`;
      case 'PAYMENT_CONFIRMED': return `Pago confirmado${p.eventName ? ` · ${p.eventName}` : ''}`;
      case 'EVENT_INVITATION_CREATED': return `Invitación${p.eventName ? ` a ${p.eventName}` : ' a evento'}`;
      case 'EVENT_INVITATION_ACCEPTED': return `${p.artistName ?? 'Un artista'} ha aceptado la invitación`;
      case 'EVENT_INVITATION_DECLINED': return `${p.artistName ?? 'Un artista'} ha rechazado la invitación`;
      case 'ARTIST_CALL_CREATED': return `Nueva convocatoria${p.venueName ? ` de ${p.venueName}` : ''}`;
      case 'REPRESENTATION_REQUEST_CREATED': return `${p.managerName ?? 'Un manager'} quiere representarte`;
      case 'REPRESENTATION_REQUEST_RESOLVED': return `Respuesta a tu solicitud: ${p.result ?? ''}`.trim();
      case 'VENUE_ARTIST_SUGGESTION_CREATED': return `${p.managerName ?? 'Un manager'} sugiere a ${p.artistName ?? 'un artista'}`;
      case 'VENUE_ARTIST_SUGGESTION_RESOLVED': return `${p.venueName ?? 'Una sala'} actualizó tu sugerencia`;
      default: return config.label;
    }
  })();

  // ─── Subtitle ─────────────────────────────────────────────────────────────
  const subtitle = (() => {
    const p = notification.payload ?? {};
    const parts: string[] = [];
    if (p.city) parts.push(p.city);
    if (p.date) parts.push(p.date);
    const minP = p.offeredMinPrice;
    const maxP = p.offeredMaxPrice;
    if (minP && maxP) parts.push(`${formatCurrency(minP, 'EUR')} – ${formatCurrency(maxP, 'EUR')}`);
    else if (maxP) parts.push(`Hasta ${formatCurrency(maxP, 'EUR')}`);
    if (p.commissionPercentage) parts.push(`Comisión: ${p.commissionPercentage}%`);
    return parts.join(' · ');
  })();

  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-2xl px-4 py-3.5 text-left transition-all ${isUnread
          ? 'bg-amber-50/50 hover:bg-amber-50'
          : 'bg-transparent hover:bg-slate-50'
        }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.bg} ${config.color}`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className={`text-sm font-bold leading-snug ${isUnread ? 'text-slate-900' : 'text-slate-700'}  truncate`}>
            {title}
          </p>
          {subtitle && (
            <p className="text-xs font-medium text-slate-500 truncate">{subtitle}</p>
          )}
          <p className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>

        {/* Unread dot */}
        {isUnread && (
          <span className="mt-2 inline-flex h-2 w-2 shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-50" />
        )}
      </div>
    </button>
  );
}

function getBookingTarget(params: { role?: string | null; bookingId?: string }) {
  const { role, bookingId } = params;
  if (bookingId) {
    return `/bookings/${bookingId}`;
  }
  const fallback =
    role === 'VENUE'
      ? '/venues/bookings'
      : role === 'PROMOTER'
        ? '/promoter/bookings'
        : role === 'MANAGER'
          ? '/manager/dashboard'
          : '/artists/bookings';
  return fallback;
}
