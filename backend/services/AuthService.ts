import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { env } from '../config/env';
import { tenantRepository } from '../repositories/TenantRepository';
import { userRepository } from '../repositories/UserRepository';
import { subscriptionRepository } from '../repositories/SubscriptionRepository';
import { planRepository } from '../repositories/PlanRepository';
import { usageTrackingRepository } from '../repositories/UsageTrackingRepository';
import { RegisterDTO, LoginDTO, JWTPayload, Tenant, User, Subscription } from '../types';

export class AuthService {
  /**
   * Register a new tenant with admin user
   * Creates: Tenant + Admin User + Free Subscription + Usage Tracking
   */
  async register(data: RegisterDTO): Promise<{
    tenant: Tenant;
    user: Omit<User, 'password_hash'>;
    subscription: Subscription;
    accessToken: string;
  }> {
    // Check if tenant slug already exists
    const existingTenant = await tenantRepository.findBySlug(data.tenantSlug);
    if (existingTenant) {
      throw new Error('Tenant with this slug already exists');
    }

    // Get Free plan
    const freePlan = await planRepository.findByName('Free');
    if (!freePlan) {
      throw new Error('Free plan not found. Please run database seeds.');
    }

    // Use transaction to ensure atomicity
    return db.transaction(async (trx) => {
      // 1. Create tenant
      const [tenant] = await trx('tenants')
        .insert({
          name: data.tenantName,
          slug: data.tenantSlug,
        })
        .returning('*');

      // 2. Create admin user
      const user = await userRepository.create({
        tenant_id: tenant.id,
        email: data.adminEmail,
        password: data.adminPassword,
        name: data.adminName,
        role: 'admin',
      });

      // 3. Create Free subscription
      const subscription = await subscriptionRepository.create(
        {
          tenant_id: tenant.id,
          plan_id: freePlan.id,
          status: 'ACTIVE',
          expires_at: null, // Free plan never expires
        },
        trx
      );

      // 4. Initialize usage tracking
      await usageTrackingRepository.initializeUsage(tenant.id, trx);

      // 5. Generate JWT
      const accessToken = this.generateToken({
        userId: user.id,
        tenantId: tenant.id,
        email: user.email,
        role: user.role,
      });

      return {
        tenant,
        user: {
          id: user.id,
          tenant_id: user.tenant_id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        subscription,
        accessToken,
      };
    });
  }

  /**
   * Login user and return JWT
   */
  async login(data: LoginDTO): Promise<{
    user: Omit<User, 'password_hash'>;
    tenant: Tenant;
    accessToken: string;
  }> {
    // Find tenant by slug
    const tenant = await tenantRepository.findBySlug(data.tenantSlug);
    if (!tenant) {
      throw new Error('Invalid credentials');
    }

    // Find user by email within tenant
    const user = await userRepository.findByEmail(data.email, tenant.id);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await userRepository.verifyPassword(user, data.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT
    const accessToken = this.generateToken({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      tenant,
      accessToken,
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as string,
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  }
}

export const authService = new AuthService();
