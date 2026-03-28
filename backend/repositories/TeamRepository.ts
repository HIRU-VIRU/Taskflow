import { db } from '../config/database';
import { Team, CreateTeamDTO, TeamMember, AddTeamMemberDTO, TeamMemberRole } from '../types';
import { Knex } from 'knex';

export class TeamRepository {
  private tableName = 'teams';
  private membersTableName = 'team_members';

  async create(
    tenantId: string,
    userId: string,
    data: CreateTeamDTO,
    trx?: Knex.Transaction
  ): Promise<Team> {
    const query = trx ? trx(this.tableName) : db(this.tableName);
    const [team] = await query
      .insert({
        tenant_id: tenantId,
        name: data.name,
        description: data.description || null,
        leader_id: data.leader_id || null,
        created_by: userId,
      })
      .returning('*');
    return team;
  }

  async findById(id: string, tenantId: string): Promise<Team | null> {
    const team = await db(this.tableName)
      .where({ id, tenant_id: tenantId })
      .first();
    return team || null;
  }

  async findByTenantId(tenantId: string): Promise<Team[]> {
    return db(this.tableName)
      .where({ tenant_id: tenantId })
      .orderBy('name', 'asc');
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<Team>
  ): Promise<Team | null> {
    const [team] = await db(this.tableName)
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return team || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const deleted = await db(this.tableName)
      .where({ id, tenant_id: tenantId })
      .del();
    return deleted > 0;
  }

  // Team Members Operations
  async addMember(
    teamId: string,
    data: AddTeamMemberDTO,
    trx?: Knex.Transaction
  ): Promise<TeamMember> {
    const query = trx ? trx(this.membersTableName) : db(this.membersTableName);
    const [member] = await query
      .insert({
        team_id: teamId,
        user_id: data.user_id,
        role: data.role || 'member',
      })
      .returning('*');
    return member;
  }

  async removeMember(teamId: string, userId: string): Promise<boolean> {
    const deleted = await db(this.membersTableName)
      .where({ team_id: teamId, user_id: userId })
      .del();
    return deleted > 0;
  }

  async getMembers(teamId: string): Promise<Array<TeamMember & { user: any }>> {
    return db(this.membersTableName)
      .join('users', 'team_members.user_id', 'users.id')
      .where('team_members.team_id', teamId)
      .select(
        'team_members.*',
        'users.name as user_name',
        'users.email as user_email'
      );
  }

  async getUserTeams(userId: string, tenantId: string): Promise<Array<Team & { role: TeamMemberRole }>> {
    return db(this.tableName)
      .join(this.membersTableName, 'teams.id', 'team_members.team_id')
      .where({
        'teams.tenant_id': tenantId,
        'team_members.user_id': userId,
      })
      .select('teams.*', 'team_members.role')
      .orderBy('teams.name', 'asc');
  }

  async isTeamLeader(teamId: string, userId: string): Promise<boolean> {
    const member = await db(this.membersTableName)
      .where({
        team_id: teamId,
        user_id: userId,
        role: 'leader',
      })
      .first();
    return !!member;
  }

  async isTeamMember(teamId: string, userId: string): Promise<boolean> {
    const member = await db(this.membersTableName)
      .where({
        team_id: teamId,
        user_id: userId,
      })
      .first();
    return !!member;
  }

  async getTeamsWithProjects(tenantId: string): Promise<Array<Team & { project_count: number }>> {
    const teams = await db(this.tableName)
      .leftJoin('projects', 'teams.id', 'projects.team_id')
      .where('teams.tenant_id', tenantId)
      .groupBy('teams.id')
      .select('teams.*')
      .count('projects.id as project_count');

    return teams.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      tenant_id: t.tenant_id as string,
      name: t.name as string,
      description: t.description as string | null,
      leader_id: t.leader_id as string | null,
      created_by: t.created_by as string,
      created_at: t.created_at as Date,
      updated_at: t.updated_at as Date,
      project_count: parseInt(t.project_count as string) || 0,
    }));
  }
}

export const teamRepository = new TeamRepository();