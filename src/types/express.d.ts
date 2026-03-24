import { Request } from 'express';
import { AuthUser, TenantContext } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenantContext?: TenantContext;
    }
  }
}

export {};
