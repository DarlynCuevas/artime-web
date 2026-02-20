import type { Role } from '@/types/booking';

type AnyRole = Role | null | undefined;

export function isArtistSideRole(role: AnyRole): boolean {
  return role === 'ARTIST' || role === 'MANAGER';
}

export function isVenueSideRole(role: AnyRole): boolean {
  return role === 'VENUE' || role === 'PROMOTER';
}

export function isSameSideRole(a: AnyRole, b: AnyRole): boolean {
  if (!a || !b) return false;
  return (
    (isArtistSideRole(a) && isArtistSideRole(b)) ||
    (isVenueSideRole(a) && isVenueSideRole(b))
  );
}

export function isArtistSideOwnerLocked(params: {
  currentRole: AnyRole;
  currentUserId?: string | null;
  ownerRole?: AnyRole;
  ownerUserId?: string | null;
}): boolean {
  const { currentRole, currentUserId, ownerRole, ownerUserId } = params;
  if (!isArtistSideRole(currentRole)) return false;
  if (!isArtistSideRole(ownerRole)) return false;
  if (!ownerUserId || !currentUserId) return false;
  return ownerUserId !== currentUserId;
}

export function isMyTurnByLastMessage(params: {
  lastSenderRole?: AnyRole;
  currentRole: AnyRole;
}): boolean {
  const { lastSenderRole, currentRole } = params;
  if (!lastSenderRole) return true;
  if (isArtistSideRole(currentRole)) {
    return isVenueSideRole(lastSenderRole);
  }
  return isArtistSideRole(lastSenderRole);
}
