import { Request, Response } from 'express';
import { projectService } from '../services/ProjectService';
import { CreateProjectDTO } from '../types';

export class ProjectController {
  /**
   * POST /api/projects
   * Create a new project (requires CREATE_PROJECT feature, enforces limit)
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const data: CreateProjectDTO = req.body;

      if (!data.name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Project name is required',
          },
        });
        return;
      }

      const project = await projectService.create(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: { project },
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('USAGE_LIMIT_EXCEEDED')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'USAGE_LIMIT_EXCEEDED',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating the project',
        },
      });
    }
  }

  /**
   * GET /api/projects
   * List all projects for tenant
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await projectService.list(tenantId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching projects',
        },
      });
    }
  }

  /**
   * GET /api/projects/:projectId
   * Get project details
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const projectId = req.params.projectId;

      const project = await projectService.getById(tenantId, projectId);

      if (!project) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { project },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching the project',
        },
      });
    }
  }

  /**
   * PUT /api/projects/:projectId
   * Update project
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const projectId = req.params.projectId;
      const data = req.body;

      const project = await projectService.update(tenantId, projectId, data);

      if (!project) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { project },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating the project',
        },
      });
    }
  }

  /**
   * DELETE /api/projects/:projectId
   * Delete project (soft delete - archive)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const projectId = req.params.projectId;

      const success = await projectService.delete(tenantId, projectId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Project archived successfully' },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting the project',
        },
      });
    }
  }
}

export const projectController = new ProjectController();
