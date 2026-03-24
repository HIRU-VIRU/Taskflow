import { db } from '../config/database';
import { projectRepository } from '../repositories/ProjectRepository';
import { usageTrackingRepository } from '../repositories/UsageTrackingRepository';
import { entitlementService } from './EntitlementService';
import { CreateProjectDTO, Project } from '../types';

export class ProjectService {
  /**
   * Create a new project with entitlement check and usage tracking
   * Uses transaction with row locking to prevent race conditions
   */
  async create(
    tenantId: string,
    userId: string,
    data: CreateProjectDTO
  ): Promise<Project> {
    // Double-check entitlement inside transaction (defensive)
    return db.transaction(async (trx) => {
      // Lock usage row to prevent race conditions
      const usage = await trx('usage_tracking')
        .where({ tenant_id: tenantId, usage_key: 'project_count' })
        .forUpdate()
        .first();

      // Re-check limit inside transaction
      const entitlement = await entitlementService.check(
        tenantId,
        'CREATE_PROJECT',
        'project_count'
      );

      if (!entitlement.allowed) {
        throw new Error(entitlement.reason || 'Not allowed to create project');
      }

      // Create project
      const project = await projectRepository.create(tenantId, userId, data, trx);

      // Increment usage
      await usageTrackingRepository.increment(tenantId, 'project_count', trx);

      return project;
    });
  }

  /**
   * Get all projects for a tenant
   */
  async getAll(tenantId: string): Promise<Project[]> {
    return projectRepository.findByTenantId(tenantId);
  }

  /**
   * List projects with pagination
   */
  async list(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    projects: Array<Project & { taskCount: number }>;
    pagination: { page: number; limit: number; total: number };
  }> {
    const projects = await projectRepository.getProjectsWithTaskCount(tenantId);
    const total = projects.length;
    const start = (page - 1) * limit;
    const paginatedProjects = projects.slice(start, start + limit).map(p => ({
      ...p,
      taskCount: p.task_count
    }));

    return {
      projects: paginatedProjects,
      pagination: { page, limit, total },
    };
  }

  /**
   * Get all projects with task count
   */
  async getAllWithTaskCount(
    tenantId: string
  ): Promise<Array<Project & { task_count: number }>> {
    return projectRepository.getProjectsWithTaskCount(tenantId);
  }

  /**
   * Get project by ID
   */
  async getById(tenantId: string, projectId: string): Promise<Project | null> {
    return projectRepository.findById(projectId, tenantId);
  }

  /**
   * Update project
   */
  async update(
    tenantId: string,
    projectId: string,
    data: Partial<CreateProjectDTO>
  ): Promise<Project | null> {
    return projectRepository.update(projectId, tenantId, data);
  }

  /**
   * Delete project and decrement usage
   */
  async delete(tenantId: string, projectId: string): Promise<boolean> {
    return db.transaction(async (trx) => {
      // Verify project exists
      const project = await projectRepository.findById(projectId, tenantId);
      if (!project) {
        return false;
      }

      // Delete project
      const deleted = await trx('projects')
        .where({ id: projectId, tenant_id: tenantId })
        .del();

      if (deleted > 0) {
        // Decrement usage
        await usageTrackingRepository.decrement(tenantId, 'project_count', trx);
      }

      return deleted > 0;
    });
  }

  /**
   * Archive project (soft delete)
   */
  async archive(id: string, tenantId: string): Promise<Project | null> {
    return projectRepository.archive(id, tenantId);
  }

  /**
   * Get project count for tenant
   */
  async getCount(tenantId: string): Promise<number> {
    return projectRepository.countByTenantId(tenantId, 'active');
  }
}

export const projectService = new ProjectService();
