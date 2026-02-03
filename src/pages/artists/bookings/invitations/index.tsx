'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { withRole } from '@/components/auth/withRole';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/auth/useAuth';
import { invitationsService } from '@/services/events/invitations.service';
import { useRouter } from 'next/router';

function ArtistEventInvitationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { invitationId } = router.query;
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/artists/me/event-invitations`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setInvitations(data);
        setLoading(false);
      });
  }, [user?.token]);

  const respond = async (id: string, action: 'accept' | 'decline') => {
    if (!user?.token) return;
    if (action === 'accept') {
      await invitationsService.accept(id, user.token);
    } else {
      await invitationsService.decline(id, user.token);
    }

    setInvitations((prev) =>
      prev.map((inv) =>
        inv.invitationId === id
          ? {
              ...inv,
              status: action === 'accept' ? 'ACCEPTED' : 'DECLINED',
            }
          : inv
      )
    );
  };

  if (loading) {
    return <div className="p-6">Cargando invitaciones…</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold">Invitaciones a eventos</h1>
        <p className="text-slate-600">
          Eventos que buscan artistas y han mostrado interés en ti.
        </p>
      </header>

      {invitations.length === 0 ? (
        <p className="text-slate-500">
          No tienes invitaciones pendientes.
        </p>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => {
            const isHighlighted = invitationId === inv.invitationId;
            return (
              <div
                key={inv.invitationId}
                className={`rounded-xl border border-slate-200 bg-white p-4 flex justify-between items-center ${isHighlighted ? 'ring-2 ring-black' : ''}`}
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {inv.event.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {inv.event.location ?? 'Ubicación por definir'} ·{' '}
                    {inv.event.startDate
                      ? new Date(inv.event.startDate).toLocaleDateString()
                      : 'Fecha por definir'}
                  </p>
                  {inv.event.organizerPromoterId && (
                    <Link
                      href={`/promoter/profile/${inv.event.organizerPromoterId}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Ver perfil del promotor
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={inv.status} />

                  {inv.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => respond(inv.invitationId, 'accept')}
                        className="px-3 py-1 rounded bg-black text-white text-sm"
                      >
                        Me interesa
                      </button>
                      <button
                        onClick={() => respond(inv.invitationId, 'decline')}
                        className="px-3 py-1 rounded border text-sm"
                      >
                        No me interesa
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default withRole(ArtistEventInvitationsPage, ['ARTIST']);
