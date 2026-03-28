import { Request, Response } from 'express';
import { teamService } from '../services/TeamService';
import { CreateTeamDTO, AddTeamMemberDTO } from '../types';

export class TeamController {
  /**
   * POST /api/teams
   * Create a new team (admin only)
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const data: CreateTeamDTO = req.body;

      if (!data.name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Team name is required',
          },
        });
        return;
      }

      const team = await teamService.create(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: { team },
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('Only admins')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: err.message,
          },
        });
        return;
      }

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
          message: 'An error occurred while creating the team',
        },
      });
    }
  }

  /**
   * GET /api/teams
   * List all teams for the tenant
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const teams = await teamService.getTeamsWithProjects(tenantId);

      res.status(200).json({
        success: true,
        data: { teams },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching teams',
        },
      });
    }
  }

  /**
   * GET /api/teams/:teamId
   * Get team details
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const teamId = req.params.teamId;

      const team = await teamService.getById(teamId, tenantId);

      if (!team) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Team not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { team },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching the team',
        },
      });
    }
  }

  /**
   * PUT /api/teams/:teamId
   * Update team (admin only)
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const teamId = req.params.teamId;
      const data = req.body;

      const team = await teamService.update(tenantId, teamId, userId, data);

      if (!team) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Team not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { team },
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('Only admins')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating the team',
        },
      });
    }
  }

  /**
   * DELETE /api/teams/:teamId
   * Delete team (admin only)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const teamId = req.params.teamId;

      const success = await teamService.delete(tenantId, teamId, userId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Team not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Team deleted successfully' },
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('Only admins')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting the team',
        },
      });
    }
  }

  /**
   * GET /api/teams/:teamId/members
   * Get team members
   */
  async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const teamId = req.params.teamId;

      const members = await teamService.getMembers(teamId, tenantId);

      res.status(200).json({
        success: true,
        data: { members },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching team members',
        },
      });
    }
  }

  /**
   * POST /api/teams/:teamId/members
   * Add member to team (admin or team leader)
   */
  async addMember(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const teamId = req.params.teamId;
      const data: AddTeamMemberDTO = req.body;

      if (!data.user_id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'user_id is required',
          },
        });
        return;
      }

      const member = await teamService.addMember(tenantId, teamId, userId, data);

      res.status(201).json({
        success: true,
        data: { member },
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('permissions') || err.message.includes('Only admins')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: err.message,
          },
        });
        return;
      }

      if (err.message.includes('not found') || err.message.includes('already a member')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while adding team member',
        },
      });
    }
  }

  /**
   * DELETE /api/teams/:teamId/members/:userId
   * Remove member from team (admin or team leader)
   */
  async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const requestingUserId = req.user!.id;
      const teamId = req.params.teamId;
      const memberUserId = req.params.userId;

      const success = await teamService.removeMember(
        tenantId,
        teamId,
        memberUserId,
        requestingUserId
      );

      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Team member not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Team member removed successfully' },
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('permissions') || err.message.includes('Only admins')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while removing team member',
        },
      });
    }
  }

  /**
   * GET /api/teams/my-teams
   * Get teams the current user belongs to
   */
  async getMyTeams(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const teams = await teamService.getUserTeams(userId, tenantId);

      res.status(200).json({
        success: true,
        data: { teams },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching user teams',
        },
      });
    }
  }
}

export const teamController = new TeamController();