import { Request, Response } from 'express';
import { taskService } from '../services/TaskService';
import { CreateTaskDTO } from '../types';

export class TaskController {
  /**
   * POST /api/projects/:projectId/tasks
   * Create a task in a project (requires CREATE_TASK feature)
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const projectId = req.params.projectId;
      const data: CreateTaskDTO = req.body;

      if (!data.title) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Task title is required',
          },
        });
        return;
      }

      const task = await taskService.create(tenantId, projectId, userId, data);

      res.status(201).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating the task',
        },
      });
    }
  }

  /**
   * GET /api/projects/:projectId/tasks
   * List tasks in a project
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const projectId = req.params.projectId;
      const status = req.query.status as string;
      const assigneeId = req.query.assignee_id as string;

      const tasks = await taskService.list(tenantId, projectId, { status, assigneeId });

      res.status(200).json({
        success: true,
        data: { tasks },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching tasks',
        },
      });
    }
  }

  /**
   * GET /api/projects/:projectId/tasks/:taskId
   * Get task details
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const taskId = req.params.taskId;

      const task = await taskService.getById(tenantId, taskId);

      if (!task) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Task not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching the task',
        },
      });
    }
  }

  /**
   * PUT /api/projects/:projectId/tasks/:taskId
   * Update task
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const taskId = req.params.taskId;
      const data = req.body;

      const task = await taskService.update(tenantId, taskId, data);

      if (!task) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Task not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating the task',
        },
      });
    }
  }

  /**
   * DELETE /api/projects/:projectId/tasks/:taskId
   * Delete task
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const taskId = req.params.taskId;

      const success = await taskService.delete(tenantId, taskId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Task not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Task deleted successfully' },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting the task',
        },
      });
    }
  }

  /**
   * GET /api/tasks
   * List all tasks for the current tenant
   */
  async listByTenant(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const status = req.query.status as string;
      const assigneeId = req.query.assignee_id as string;

      const tasks = await taskService.getByTenant(tenantId);
      
      let filteredTasks = tasks;
      if (status) {
        filteredTasks = filteredTasks.filter(t => t.status === status);
      }
      if (assigneeId) {
        filteredTasks = filteredTasks.filter(t => t.assignee_id === assigneeId);
      }

      res.status(200).json({
        success: true,
        data: { tasks: filteredTasks },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching tasks for the tenant',
        },
      });
    }
  }
}

export const taskController = new TaskController();
