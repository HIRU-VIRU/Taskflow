import apiClient from './client';
import { Team, CreateTeamRequest, TeamMember, AddTeamMemberRequest } from '../types';

export const teamsApi = {
  // Create a new team (admin only)
  createTeam: async (data: CreateTeamRequest): Promise<Team> => {
    const response = ((await apiClient.post<any>('/teams', data)) as any);
    return response.team;
  },

  // Get all teams for the tenant
  getTeams: async (): Promise<Team[]> => {
    const response = ((await apiClient.get<any>('/teams')) as any);
    return response.teams || [];
  },

  // Get teams the current user belongs to
  getMyTeams: async (): Promise<Array<Team & { role: string }>> => {
    const response = ((await apiClient.get<any>('/teams/my-teams')) as any);
    return response.teams || [];
  },

  // Get team by ID
  getTeam: async (teamId: string): Promise<Team> => {
    const response = ((await apiClient.get<any>(`/teams/${teamId}`)) as any);
    return response.team;
  },

  // Update team (admin only)
  updateTeam: async (teamId: string, data: Partial<CreateTeamRequest>): Promise<Team> => {
    const response = ((await apiClient.put<any>(`/teams/${teamId}`, data)) as any);
    return response.team;
  },

  // Delete team (admin only)
  deleteTeam: async (teamId: string): Promise<void> => {
    ((await apiClient.delete<any>(`/teams/${teamId}`)) as any);
  },

  // Get team members
  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const response = ((await apiClient.get<any>(`/teams/${teamId}/members`)) as any);
    return response.members || [];
  },

  // Add member to team (admin or team leader)
  addTeamMember: async (teamId: string, data: AddTeamMemberRequest): Promise<TeamMember> => {
    const response = ((await apiClient.post<any>(`/teams/${teamId}/members`, data)) as any);
    return response.member;
  },

  // Remove member from team (admin or team leader)
  removeTeamMember: async (teamId: string, userId: string): Promise<void> => {
    ((await apiClient.delete<any>(`/teams/${teamId}/members/${userId}`)) as any);
  },
};