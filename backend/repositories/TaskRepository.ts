import { db } from '../config/database';
import { Task, CreateTaskDTO, TaskStatus } from '../types';

export class TaskRepository {
  private tableName = 'tasks';

  async create(
    projectId: string,
    tenantId: string,
    userId: string,
    data: CreateTaskDTO
  ): Promise<Task> {
    const [task] = await db(this.tableName)
      .insert({
        project_id: projectId,
        tenant_id: tenantId,
        title: data.title,
        description: data.description || null,
        status: 'todo',
        priority: data.priority || 'medium',
        assignee_id: data.assignee_id || null,
        created_by: userId,
        due_date: data.due_date || null,
      })
      .returning('*');
    return task;
  }

  async findById(id: string, tenantId: string): Promise<Task | null> {
    // All queries MUST include tenant_id filter for tenant isolation
    const task = await db(this.tableName)
      .where({ id, tenant_id: tenantId })
      .first();
    return task || null;
  }

  async findByProjectId(projectId: string, tenantId: string): Promise<Task[]> {
    // All queries MUST include tenant_id filter for tenant isolation
    return db(this.tableName)
      .where({ project_id: projectId, tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  async findByTenantId(tenantId: string): Promise<Task[]> {
    // All queries MUST include tenant_id filter for tenant isolation
    return db(this.tableName)
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  async findByAssignee(assigneeId: string, tenantId: string): Promise<Task[]> {
    // All queries MUST include tenant_id filter for tenant isolation
    return db(this.tableName)
      .where({ assignee_id: assigneeId, tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  async countByStatus(tenantId: string): Promise<Record<TaskStatus, number>> {
    // All queries MUST include tenant_id filter for tenant isolation
    const counts = await db(this.tableName)
      .where({ tenant_id: tenantId })
      .groupBy('status')
      .select('status')
      .count('id as count');

    const result: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      done: 0,
    };

    counts.forEach((c) => {
      result[c.status as TaskStatus] = parseInt(c.count as string) || 0;
    });

    return result;
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<Task>
  ): Promise<Task | null> {
    // All queries MUST include tenant_id filter for tenant isolation
    const [task] = await db(this.tableName)
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return task || null;
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: TaskStatus
  ): Promise<Task | null> {
    return this.update(id, tenantId, { status });
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // All queries MUST include tenant_id filter for tenant isolation
    const deleted = await db(this.tableName)
      .where({ id, tenant_id: tenantId })
      .del();
    return deleted > 0;
  }
}

export const taskRepository = new TaskRepository();
