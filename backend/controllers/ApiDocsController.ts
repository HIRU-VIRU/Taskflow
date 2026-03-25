import { Request, Response } from 'express';

export class ApiDocsController {
  /**
   * GET /api/docs
   * Get API documentation with role-based access information
   */
  async getDocs(req: Request, res: Response): Promise<void> {
    const user = req.user;

    const endpoints = [
      {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register new tenant with admin user',
        access: 'Public',
        roles: [],
        auth: false,
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Login with email, password, and tenant slug',
        access: 'Public',
        roles: [],
        auth: false,
      },
      {
        method: 'GET',
        path: '/api/auth/me',
        description: 'Get current user info',
        access: 'Authenticated',
        roles: ['admin', 'member'],
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/users',
        description: 'List all users in tenant',
        access: 'Authenticated',
        roles: ['admin', 'member'],
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/users/invite',
        description: 'Invite new user (requires INVITE_USER feature)',
        access: 'Admin Only',
        roles: ['admin'],
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/users/:userId',
        description: 'Get user details (own profile or admin)',
        access: 'Authenticated (own profile) or Admin',
        roles: ['admin', 'member'],
        auth: true,
      },
      {
        method: 'PUT',
        path: '/api/users/:userId',
        description: 'Update user profile (own profile or admin)',
        access: 'Authenticated (own profile) or Admin',
        roles: ['admin', 'member'],
        auth: true,
      },
      {
        method: 'DELETE',
        path: '/api/users/:userId',
        description: 'Remove user from tenant',
        access: 'Admin Only',
        roles: ['admin'],
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/admin/dashboard',
        description: 'Get admin dashboard statistics',
        access: 'Admin Only',
        roles: ['admin'],
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/admin/users',
        description: 'Get detailed user management view',
        access: 'Admin Only',
        roles: ['admin'],
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/admin/users/:userId/promote',
        description: 'Promote user to admin',
        access: 'Admin Only',
        roles: ['admin'],
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/admin/users/:userId/demote',
        description: 'Demote admin to member',
        access: 'Admin Only',
        roles: ['admin'],
        auth: true,
      },
    ];

    // Filter endpoints based on user's role
    const availableEndpoints = user
      ? endpoints.filter(endpoint =>
          !endpoint.auth ||
          endpoint.roles.length === 0 ||
          endpoint.roles.includes(user.role as 'admin' | 'member')
        )
      : endpoints.filter(endpoint => !endpoint.auth);

    res.status(200).json({
      success: true,
      data: {
        message: 'TaskFlow API Documentation',
        user: user ? {
          id: user.id,
          role: user.role,
          tenantId: user.tenantId,
        } : null,
        roleSystem: {
          roles: [
            {
              name: 'admin',
              description: 'Full access to all tenant resources and user management',
              permissions: [
                'Create, read, update, delete all resources',
                'Invite and manage users',
                'Change user roles',
                'Access admin dashboard',
                'Manage subscription plans',
                'View analytics',
              ],
            },
            {
              name: 'member',
              description: 'Standard user with limited permissions',
              permissions: [
                'Create and manage own projects',
                'Create and manage tasks',
                'View other users in tenant',
                'Update own profile',
                'Basic analytics access',
              ],
            },
          ],
        },
        authentication: {
          type: 'JWT Bearer Token',
          header: 'Authorization: Bearer <token>',
          expires: '24 hours (configurable)',
          multiTenant: 'Each token is scoped to a specific tenant',
        },
        endpoints: availableEndpoints,
      },
    });
  }
}

export const apiDocsController = new ApiDocsController();