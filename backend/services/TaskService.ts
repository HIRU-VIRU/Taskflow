import { taskRepository } from '../repositories/TaskRepository';
import { projectRepository } from '../repositories/ProjectRepository';
import { CreateTaskDTO, Task, TaskStatus } from '../types';

export class TaskService {
  /**
   * Create a new task
   * Entitlement check should be done at middleware level
   */
  async create(
    tenantId: string,
    projectId: string,
    userId: string,
    data: CreateTaskDTO
  ): Promise<Task> {
    // Verify project exists and belongs to tenant
    const project = await projectRepository.findById(projectId, tenantId);
    if (!project) {
      throw new Error('Project not found');
    }

    return taskRepository.create(projectId, tenantId, userId, data);
  }

  /**
   * List tasks for a project with optional filters
   */
  async list(
    tenantId: string,
    projectId: string,
    filters: { status?: string; assigneeId?: string }
  ): Promise<Task[]> {
    // Verify project exists and belongs to tenant
    const project = await projectRepository.findById(projectId, tenantId);
    if (!project) {
      throw new Error('Project not found');
    }

    let tasks = await taskRepository.findByProjectId(projectId, tenantId);

    if (filters.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters.assigneeId) {
      tasks = tasks.filter(t => t.assignee_id === filters.assigneeId);
    }

    return tasks;
  }

  /**
   * Get all tasks for a project
   */
  async getByProject(projectId: string, tenantId: string): Promise<Task[]> {
    // Verify project exists and belongs to tenant
    const project = await projectRepository.findById(projectId, tenantId);
    if (!project) {
      throw new Error('Project not found');
    }

    return taskRepository.findByProjectId(projectId, tenantId);
  }

  /**
   * Get task by ID
   */
  async getById(id: string, tenantId: string): Promise<Task | null> {
    return taskRepository.findById(id, tenantId);
  }

  /**
   * Get all tasks for a tenant
   */
  async getByTenant(tenantId: string): Promise<Task[]> {
    return taskRepository.findByTenantId(tenantId);
  }

  /**
   * Get tasks assigned to a user
   */
  async getByAssignee(assigneeId: string, tenantId: string): Promise<Task[]> {
    return taskRepository.findByAssignee(assigneeId, tenantId);
  }

  /**
   * Update task
   */
  async update(
    tenantId: string,
    taskId: string,
    data: Partial<CreateTaskDTO>
  ): Promise<Task | null> {
    // Convert CreateTaskDTO fields to Task fields
    const updateData: Partial<Task> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status as TaskStatus;
    if (data.assignee_id !== undefined) updateData.assignee_id = data.assignee_id;
    if (data.due_date !== undefined) {
      updateData.due_date = data.due_date ? new Date(data.due_date) : null;
    }

    return taskRepository.update(taskId, tenantId, updateData);
  }

  /**
   * Delete task
   */
  async delete(tenantId: string, taskId: string): Promise<boolean> {
    return taskRepository.delete(taskId, tenantId);
  }

  /**
   * Get task count by status
   */
  async getCountByStatus(
    tenantId: string
  ): Promise<Record<TaskStatus, number>> {
    return taskRepository.countByStatus(tenantId);
  }
}

export const taskService = new TaskService();
