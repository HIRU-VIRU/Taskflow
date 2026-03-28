import { teamRepository } from '../repositories/TeamRepository';
import { userRepository } from '../repositories/UserRepository';
import { Team, CreateTeamDTO, TeamMember, AddTeamMemberDTO } from '../types';

export class TeamService {
  /**
   * Create a new team (admin only)
   */
  async create(
    tenantId: string,
    userId: string,
    data: CreateTeamDTO
  ): Promise<Team> {
    // Verify the user is admin
    const user = await userRepository.findById(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can create teams');
    }

    // Verify leader exists if specified
    if (data.leader_id) {
      const leader = await userRepository.findById(data.leader_id);
      if (!leader) {
        throw new Error('Team leader not found');
      }
    }

    const team = await teamRepository.create(tenantId, userId, data);

    // If leader specified, add them to the team automatically
    if (data.leader_id) {
      await teamRepository.addMember(team.id, {
        user_id: data.leader_id,
        role: 'leader',
      });
    }

    return team;
  }

  /**
   * Get team by ID
   */
  async getById(id: string, tenantId: string): Promise<Team | null> {
    return teamRepository.findById(id, tenantId);
  }

  /**
   * Get all teams for a tenant
   */
  async getByTenant(tenantId: string): Promise<Team[]> {
    return teamRepository.findByTenantId(tenantId);
  }

  /**
   * Get teams with project counts
   */
  async getTeamsWithProjects(tenantId: string): Promise<Array<Team & { project_count: number }>> {
    return teamRepository.getTeamsWithProjects(tenantId);
  }

  /**
   * Update team (admin only)
   */
  async update(
    tenantId: string,
    teamId: string,
    userId: string,
    data: Partial<CreateTeamDTO>
  ): Promise<Team | null> {
    // Verify the user is admin
    const user = await userRepository.findById(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can update teams');
    }

    // Verify team exists
    const team = await teamRepository.findById(teamId, tenantId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Verify new leader exists if specified
    if (data.leader_id) {
      const leader = await userRepository.findById(data.leader_id);
      if (!leader) {
        throw new Error('New team leader not found');
      }

      // Remove old leader role if changing leaders
      if (team.leader_id && team.leader_id !== data.leader_id) {
        await teamRepository.removeMember(teamId, team.leader_id);
      }

      // Add new leader to team
      await teamRepository.addMember(teamId, {
        user_id: data.leader_id,
        role: 'leader',
      });
    }

    return teamRepository.update(teamId, tenantId, data);
  }

  /**
   * Delete team (admin only)
   */
  async delete(tenantId: string, teamId: string, userId: string): Promise<boolean> {
    // Verify the user is admin
    const user = await userRepository.findById(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can delete teams');
    }

    return teamRepository.delete(teamId, tenantId);
  }

  /**
   * Add member to team (admin or team leader)
   */
  async addMember(
    tenantId: string,
    teamId: string,
    userId: string,
    data: AddTeamMemberDTO
  ): Promise<TeamMember> {
    // Verify user permissions (admin or team leader)
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const canManageTeam = user.role === 'admin' ||
                         await teamRepository.isTeamLeader(teamId, userId);

    if (!canManageTeam) {
      throw new Error('Only admins or team leaders can add members');
    }

    // Verify member to add exists
    const newMember = await userRepository.findById(data.user_id);
    if (!newMember) {
      throw new Error('User to add not found');
    }

    // Check if already a member
    const isAlreadyMember = await teamRepository.isTeamMember(teamId, data.user_id);
    if (isAlreadyMember) {
      throw new Error('User is already a team member');
    }

    return teamRepository.addMember(teamId, data);
  }

  /**
   * Remove member from team (admin or team leader)
   */
  async removeMember(
    tenantId: string,
    teamId: string,
    memberUserId: string,
    requestingUserId: string
  ): Promise<boolean> {
    // Verify user permissions (admin or team leader)
    const user = await userRepository.findById(requestingUserId);
    if (!user) {
      throw new Error('User not found');
    }

    const canManageTeam = user.role === 'admin' ||
                         await teamRepository.isTeamLeader(teamId, requestingUserId);

    if (!canManageTeam) {
      throw new Error('Only admins or team leaders can remove members');
    }

    return teamRepository.removeMember(teamId, memberUserId);
  }

  /**
   * Get team members
   */
  async getMembers(teamId: string, tenantId: string): Promise<Array<TeamMember & { user: any }>> {
    // Verify team exists
    const team = await teamRepository.findById(teamId, tenantId);
    if (!team) {
      throw new Error('Team not found');
    }

    return teamRepository.getMembers(teamId);
  }

  /**
   * Get user's teams
   */
  async getUserTeams(userId: string, tenantId: string): Promise<Array<Team & { role: any }>> {
    return teamRepository.getUserTeams(userId, tenantId);
  }

  /**
   * Check if user can manage tasks in project (team leader or admin)
   */
  async canManageProjectTasks(
    userId: string,
    projectId: string,
    tenantId: string
  ): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) return false;

    // Admins can always manage tasks
    if (user.role === 'admin') return true;

    // Get project's team
    const project = await import('../repositories/ProjectRepository').then(
      module => module.projectRepository.findById(projectId, tenantId)
    );

    if (!project || !project.team_id) {
      return false; // No team assigned to project
    }

    // Check if user is team leader
    return teamRepository.isTeamLeader(project.team_id, userId);
  }
}

export const teamService = new TeamService();