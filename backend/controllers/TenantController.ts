import { Request, Response } from 'express';
import { tenantService } from '../services/TenantService';

export class TenantController {
  /**
   * GET /api/tenants/current
   * Get current tenant details
   */
  async getCurrent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      const tenantInfo = await tenantService.getTenantInfo(tenantId);

      if (!tenantInfo) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tenant not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: tenantInfo,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching tenant info',
        },
      });
    }
  }

  /**
   * PUT /api/tenants/current
   * Update current tenant details (admin only)
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { name } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tenant name is required',
          },
        });
        return;
      }

      const tenant = await tenantService.update(tenantId, { name });

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tenant not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { tenant },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating the tenant',
        },
      });
    }
  }

  /**
   * DELETE /api/tenants/current
   * Delete current tenant (admin only) - DESTRUCTIVE OPERATION
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      const deleted = await tenantService.delete(tenantId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tenant not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Tenant and all associated data have been permanently deleted' },
      });
    } catch (error) {
      console.error('[TenantController] Delete error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting the tenant',
        },
      });
    }
  }
}

export const tenantController = new TenantController();
