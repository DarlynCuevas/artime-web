import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  LayoutDashboard,
  Settings,
  Ticket,
  UserRound,
  Users,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react';

import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
import { useAuth } from '@/hooks/auth/useAuth';
import { useMe } from '@/hooks/auth/useMe';
import { useArtistNotifications } from '@/hooks/artists/useArtistNotifications';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/services/supabase/supabaseClient';

const navByRole: Record<string, { label: string; items: { label: string; href: string; icon: any }[] }[]> = {
  VENUE: [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard', href: '/venues/dashboard', icon: LayoutDashboard },
        { label: 'Artistas', href: '/venues/discover', icon: Users },
        { label: 'Bookings', href: '/venues/bookings', icon: Ticket },
      ],
    },
    {
      label: 'Sistema',
      items: [{ label: 'Configuración', href: '/settings', icon: Settings }],
    },
  ],
  ARTIST: [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard', href: '/artists/dashboard', icon: LayoutDashboard },
        { label: 'Calendario', href: '/artists/calendar', icon: CalendarDays },
        { label: 'Bookings', href: '/artists/bookings', icon: Ticket },
        { label: 'Perfil', href: '/artists', icon: UserRound },
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
  const [loggingOut, setLoggingOut] = useState(false);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const navSections = useMemo(() => navByRole[role ?? ''] ?? [], [role]);
  const navSectionsWithProfile = useMemo(() => {
    return navSections.map((section) => {
      if (role === 'VENUE' && section.label === 'Principal') {
        const venueProfileHref = profileId ? `/venues/profile/${profileId}` : '/venues/profile';
        return {
          ...section,
          items: section.items.map((item) => (item.label === 'Perfil' ? { ...item, href: venueProfileHref } : item)),
        };
      }
      return section;
    });
  }, [navSections, role, profileId]);

  const { notifications: latestNotifications = [], unreadCount, markAsRead } = useArtistNotifications({
    userId: user?.id,
    token: user?.token,
    role,
    limit: 20,
  });

  const mainSections = navSectionsWithProfile.filter((section) => section.label !== 'Sistema');
  const systemSection = navSectionsWithProfile.find((section) => section.label === 'Sistema');

  const isActive = (href: string) => router.pathname.startsWith(href);

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

  if (loading) return null;

  return (
    <SidebarProvider>
      <Sidebar className="border-none shadow-2xl shadow-slate-950/20">
        <SidebarHeader className="px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/20">
              <Image src="/favicon.ico" alt="Artime" width={24} height={24} className="h-6 w-6 rounded-md" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white">ARTIME</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Operation System</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4">
          <div className="space-y-6">
            {mainSections.map((section) => (
              <SidebarGroup key={section.label} className="p-0">
                <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarMenu className="gap-1">
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon />
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
            <SidebarGroup key={systemSection.label} className="p-0 mt-auto">
              <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">
                {systemSection.label}
              </SidebarGroupLabel>
              <SidebarMenu>
                {systemSection.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ) : null}
        </SidebarContent>

        <SidebarFooter className="p-6 pt-4 border-t border-white/5">
          <div className="flex flex-col gap-0.5">
            <div className="text-[13px] font-black tracking-tight text-white">{profileName ?? 'Usuario Operativo'}</div>
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{role ?? 'Sin rol'}</div>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="w-full flex-1 pb-20 md:pb-0 overflow-hidden">
        <header className="sticky top-0 z-30 h-16 flex items-center gap-4 border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-xl transition-all">
          <SidebarTrigger className="h-9 w-9 rounded-xl border border-slate-200 bg-white shadow-sm" />
          <Separator orientation="vertical" className="h-6 opacity-30" />

          <div className="flex items-center gap-3 md:hidden">
            <div className="size-7 rounded-lg bg-slate-900 flex items-center justify-center">
              <Image src="/favicon.ico" alt="Artime" width={20} height={20} className="h-5 w-5" />
            </div>
            <span className="text-[13px] font-black tracking-[0.1em] text-slate-900">ARTIME</span>
          </div>

          <div className="hidden md:block">
            <RoleBadge role={role} profileName={profileName} />
          </div>

          <div className="relative ml-auto flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <Button
                ref={bellRef}
                variant="ghost"
                size="icon"
                className={`h-10 w-10 rounded-xl border transition-all ${
                  showDropdown ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
                }`}
                onClick={() => setShowDropdown((s) => !s)}
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white ring-4 ring-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {showDropdown && (
                <div className="absolute right-0 top-14 w-[380px] rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Artime Monitor</p>
                      <p className="text-sm font-bold text-slate-900">Actividad reciente</p>
                    </div>
                    <button
                      type="button"
                      className="text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-colors"
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
                      Limpiar panel
                    </button>
                  </div>

                  <div className="max-h-[480px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {latestNotifications.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto">
                           <Bell className="size-5 text-slate-300" />
                        </div>
                        <p className="text-[13px] font-bold text-slate-900">Sin notificaciones pendientes</p>
                        <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto leading-relaxed">Te avisaremos cuando haya actualizaciones en tus bookings.</p>
                      </div>
                    ) : (
                      latestNotifications.map((n) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onClick={async () => {
                            try {
                              if (n.status === 'UNREAD') {
                                try {
                                  await markAsRead(n.id);
                                } catch (e) {}
                              }

                              const callId = n.payload?.callId;
                              if (callId) {
                                const qs = new URLSearchParams();
                                if (n.payload?.city) qs.set('city', n.payload.city);
                                if (n.payload?.date) qs.set('date', n.payload.date);
                                if (n.payload?.offeredMaxPrice) qs.set('price', String(n.payload.offeredMaxPrice));
                                if (n.payload?.venueName) qs.set('venueName', n.payload.venueName);
                                router.push(`/artists/calls/${callId}?${qs.toString()}`);
                                setShowDropdown(false);
                                return;
                              }

                              if (n.type === 'REPRESENTATION_REQUEST_CREATED') {
                                const repRequestId = n.payload?.requestId || n.payload?.request_id || n.payload?.id;
                                const path = repRequestId ? `/artists/representation-requests/${repRequestId}` : '/artists/representation-requests';
                                const qs = new URLSearchParams();
                                const mgrName = n.payload?.managerName || n.payload?.manager_name;
                                const commission = n.payload?.commissionPercentage || n.payload?.commission_percentage;
                                if (mgrName) qs.set('managerName', mgrName);
                                if (commission) qs.set('commission', String(commission));
                                router.push(`${path}${qs.toString() ? `?${qs.toString()}` : ''}`);
                                setShowDropdown(false);
                                return;
                              }

                              if (n.type === 'REPRESENTATION_REQUEST_RESOLVED') {
                                router.push(role === 'MANAGER' ? '/manager/artists' : '/artists/representation-requests');
                                setShowDropdown(false);
                                return;
                              }

                              if (n.type === 'BOOKING_REQUEST') {
                                const bId = n.payload?.bookingId;
                                if (role === 'MANAGER' && bId) {
                                  router.push(`/bookings/${bId}`);
                                } else {
                                  const base = role === 'VENUE' ? '/venues/bookings' : role === 'PROMOTER' ? '/promoter/bookings' : '/artists/bookings';
                                  router.push(bId ? `${base}?bookingId=${bId}` : base);
                                }
                                setShowDropdown(false);
                                return;
                              }

                              if (n.type === 'EVENT_INVITATION_CREATED') {
                                const eId = n.payload?.eventId || n.payload?.event_id;
                                const iId = n.payload?.invitationId || n.payload?.invitation_id;
                                router.push(iId ? `/artists/bookings/invitations?invitationId=${iId}` : eId ? `/events/${eId}#event-invitations` : '/artists/bookings/invitations');
                                setShowDropdown(false);
                                return;
                              }

                              const iId = n.payload?.invitationId;
                              const eId = n.payload?.eventId;
                              if ((n.type === 'EVENT_INVITATION_ACCEPTED' || n.type === 'EVENT_INVITATION_DECLINED') && eId) {
                                router.push(`/events/${eId}#event-invitations`);
                                setShowDropdown(false);
                                return;
                              }

                              if (iId) {
                                router.push(`/artists/bookings/invitations?invitationId=${iId}`);
                                setShowDropdown(false);
                                return;
                              }

                              setShowDropdown(false);
                            } catch (e) {
                              setShowDropdown(false);
                            }
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className={`h-10 w-10 rounded-xl border transition-all ${
                  showUserMenu ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
                }`}
                onClick={() => setShowUserMenu((s) => !s)}
              >
                <UserRound className="size-5" />
              </Button>

              {showUserMenu && (
                <div className="absolute right-0 top-14 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="px-3 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Sesión activa</p>
                    <p className="text-[13px] font-bold text-slate-900 truncate">{user?.email}</p>
                  </div>

                  <Link
                    href="/settings"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                       <Settings className="size-4" />
                    </div>
                    <span>Configuración</span>
                    <ChevronRight className="size-3.5 ml-auto text-slate-300" />
                  </Link>

                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-bold text-red-600 hover:bg-red-50 transition-colors"
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
                    <div className="size-8 rounded-lg bg-red-100 flex items-center justify-center">
                       <LogOut className="size-4" />
                    </div>
                    <span>{loggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="w-full flex-1 p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto">{children}</div>
      </SidebarInset>

      <BottomNav items={mainSections.flatMap((section) => section.items)} />
    </SidebarProvider>
  );
}

function RoleBadge({ role, profileName }: { role?: string | null; profileName?: string | null }) {
  if (!role) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-[13px] font-bold text-slate-700 shadow-sm border-dashed">
      <div className="size-2 rounded-full bg-slate-900" />
      <span className="uppercase tracking-widest text-[11px] font-black">{role}</span>
      {profileName && <span className="text-slate-300">|</span>}
      {profileName && <span className="text-slate-600">{profileName}</span>}
    </div>
  );
}

function NotificationItem({ notification, onClick }: { notification: any; onClick: () => void }) {
  const isUnread = notification.status === 'UNREAD';
  const requesterName = notification.payload?.eventName ?? notification.payload?.venueName;

  const typeMap: Record<string, { title: string; icon: any; color: string }> = {
    ARTIST_CALL_CREATED: { title: 'Nueva convocatoria', icon: Ticket, color: 'text-blue-600' },
    EVENT_INVITATION_CREATED: { title: 'Invitación a evento', icon: CalendarDays, color: 'text-purple-600' },
    EVENT_INVITATION_ACCEPTED: { title: 'Invitación aceptada', icon: CheckCircle2, color: 'text-emerald-600' },
    EVENT_INVITATION_DECLINED: { title: 'Invitación rechazada', icon: XCircle, color: 'text-amber-600' },
    BOOKING_REQUEST: { title: 'Solicitud de contratación', icon: Ticket, color: 'text-slate-900' },
    REPRESENTATION_REQUEST_CREATED: { title: 'Solicitud de representación', icon: UserRound, color: 'text-blue-600' },
    REPRESENTATION_REQUEST_RESOLVED: { title: 'Solicitud resuelta', icon: CheckCircle2, color: 'text-emerald-600' },
  };

  const config = typeMap[notification.type] || { title: notification.type, icon: Bell, color: 'text-slate-500' };

  const location =
    notification.type === 'EVENT_INVITATION_ACCEPTED' || notification.type === 'EVENT_INVITATION_DECLINED'
      ? notification.payload?.eventName ?? ''
      : notification.type === 'BOOKING_REQUEST'
        ? `${notification.payload?.eventName ?? notification.payload?.venueName ?? ''}`
        : notification.type === 'REPRESENTATION_REQUEST_CREATED'
          ? `${notification.payload?.managerName ?? 'Manager'} propone ${notification.payload?.commissionPercentage ?? '—'}%`
          : `${notification.payload?.venueName ? `${notification.payload.venueName} · ` : ''}${notification.payload?.city ?? ''}`;

  return (
    <button
      className={`w-full rounded-xl p-4 text-left transition-all border group ${
        isUnread
          ? 'border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:border-slate-300'
          : 'border-transparent bg-slate-50/30 grayscale-[0.5] opacity-70 hover:opacity-100 hover:grayscale-0'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${isUnread ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
          <config.icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-black uppercase tracking-wider ${isUnread ? 'text-slate-900' : 'text-slate-500'}`}>{config.title}</span>
            {isUnread && <span className="size-1.5 rounded-full bg-emerald-500" />}
          </div>
          <p className={`text-[13px] font-bold truncate ${isUnread ? 'text-slate-900' : 'text-slate-500'}`}>{location || 'Detalle no disponible'}</p>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>{notification.payload?.date || 'Fecha pendiente'}</span>
            {notification.payload?.offeredMaxPrice && (
               <>
                <span>·</span>
                <span className="text-emerald-600 font-black">{formatCurrency(notification.payload.offeredMaxPrice, 'EUR')}</span>
               </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
