import apiClient from './client';

export interface Invitation {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  invited_by?: string;
}

export const invitationsApi = {
  // Get all pending invitations for the tenant (admin only)
  getPendingInvitations: async (): Promise<Invitation[]> => {
    const response = (await apiClient.get<any>('/invitations')) as any;
    return Array.isArray(response) ? response : response.invitations || [];
  },

  // Cancel/revoke an invitation (admin only)
  cancelInvitation: async (invitationId: string): Promise<void> => {
    await apiClient.delete(`/invitations/${invitationId}`);
  },

  // Resend an invitation email (admin only)
  resendInvitation: async (invitationId: string): Promise<void> => {
    await apiClient.post(`/invitations/${invitationId}/resend`);
  },

  // Create a new invitation (admin only)
  createInvitation: async (data: { email: string; name: string; role?: string }): Promise<Invitation> => {
    const response = (await apiClient.post<any>('/invitations', data)) as any;
    return response.invitation || response;
  },
};
