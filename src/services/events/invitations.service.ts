export const invitationsService = {
  async accept(invitationId: string) {
    await fetch(`/invitations/${invitationId}/accept`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  async decline(invitationId: string) {
    await fetch(`/invitations/${invitationId}/decline`, {
      method: 'POST',
      credentials: 'include',
    });
  },
};
