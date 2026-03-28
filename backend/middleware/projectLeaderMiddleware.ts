import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/TeamService';

/**
 * Middleware to check if user can create/modify tasks in a project
 * Only team leaders or admins can create tasks
 */
export const requireTeamLeaderOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const projectId = req.params.projectId;

    if (!projectId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Project ID is required',
        },
      });
      return;
    }

    // Check if user can manage tasks in this project (admin or team leader)
    const canManageTasks = await teamService.canManageProjectTasks(
      user.id,
      projectId,
      user.tenantId
    );

    if (!canManageTasks) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only team leaders and admins can manage tasks in this project',
        },
      });
      return;
    }

    // User has permission, allow access
    next();
  } catch (error) {
    console.error('Error in requireTeamLeaderOrAdmin middleware:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while checking permissions',
      },
    });
  }
};

// Keep old name for backward compatibility, but use new team-based logic
export const requireProjectLeaderOrAdmin = requireTeamLeaderOrAdmin;