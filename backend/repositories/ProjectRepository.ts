import { db } from '../config/database';
import { Project, CreateProjectDTO, ProjectStatus } from '../types';
import { Knex } from 'knex';

export class ProjectRepository {
  private tableName = 'projects';

  async create(
    tenantId: string,
    userId: string,
    data: CreateProjectDTO,
    trx?: Knex.Transaction
  ): Promise<Project> {
    const query = trx ? trx(this.tableName) : db(this.tableName);
    const [project] = await query
      .insert({
        tenant_id: tenantId,
        name: data.name,
        description: data.description || null,
        status: 'active',
        created_by: userId,
        leader_id: data.leader_id || null,
        team_id: data.team_id || null,
      })
      .returning('*');
    return project;
  }

  async findById(id: string, tenantId: string): Promise<Project | null> {
    // All queries MUST include tenant_id filter for tenant isolation
    const project = await db(this.tableName)
      .where({ id, tenant_id: tenantId })
      .first();
    return project || null;
  }

  async findByTenantId(
    tenantId: string,
    status?: ProjectStatus
  ): Promise<Project[]> {
    // All queries MUST include tenant_id filter for tenant isolation
    let query = db(this.tableName).where({ tenant_id: tenantId });
    if (status) {
      query = query.andWhere({ status });
    }
    return query.orderBy('created_at', 'desc');
  }

  async countByTenantId(tenantId: string, status?: ProjectStatus): Promise<number> {
    // All queries MUST include tenant_id filter for tenant isolation
    let query = db(this.tableName).where({ tenant_id: tenantId });
    if (status) {
      query = query.andWhere({ status });
    }
    const result = await query.count('id as count').first();
    return parseInt(result?.count as string) || 0;
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<Project>
  ): Promise<Project | null> {
    // All queries MUST include tenant_id filter for tenant isolation
    const [project] = await db(this.tableName)
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return project || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // All queries MUST include tenant_id filter for tenant isolation
    const deleted = await db(this.tableName)
      .where({ id, tenant_id: tenantId })
      .del();
    return deleted > 0;
  }

  async archive(id: string, tenantId: string): Promise<Project | null> {
    return this.update(id, tenantId, { status: 'archived' });
  }

  async getProjectsWithTaskCount(
    tenantId: string,
    status?: ProjectStatus
  ): Promise<Array<Project & { task_count: number }>> {
    // All queries MUST include tenant_id filter for tenant isolation
    let query = db(this.tableName)
      .leftJoin('tasks', 'projects.id', 'tasks.project_id')
      .where('projects.tenant_id', tenantId);

    // Filter by status if specified
    if (status) {
      query = query.andWhere('projects.status', status);
    }

    const projects = await query
      .groupBy('projects.id')
      .select('projects.*')
      .count('tasks.id as task_count');

    return projects.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      tenant_id: p.tenant_id as string,
      name: p.name as string,
      description: p.description as string | null,
      status: p.status as ProjectStatus,
      created_by: p.created_by as string,
      leader_id: p.leader_id as string | null,
      team_id: p.team_id as string | null,
      created_at: p.created_at as Date,
      updated_at: p.updated_at as Date,
      task_count: parseInt(p.task_count as string) || 0,
    }));
  }
}

export const projectRepository = new ProjectRepository();
