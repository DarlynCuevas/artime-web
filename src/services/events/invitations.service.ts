const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const invitationsService = {
  async accept(invitationId: string, token: string) {
    await fetch(`${BASE_URL}/event-invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async decline(invitationId: string, token: string) {
    await fetch(`${BASE_URL}/event-invitations/${invitationId}/decline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
