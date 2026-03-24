import { db } from '../config/database';
import { User, CreateUserDTO, UserResponse } from '../types';
import bcrypt from 'bcryptjs';

export class UserRepository {
  private tableName = 'users';

  async create(data: CreateUserDTO): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const [user] = await db(this.tableName)
      .insert({
        tenant_id: data.tenant_id,
        email: data.email,
        password_hash: passwordHash,
        name: data.name,
        role: data.role || 'member',
      })
      .returning('*');
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = await db(this.tableName).where({ id }).first();
    return user || null;
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const user = await db(this.tableName)
      .where({ email, tenant_id: tenantId })
      .first();
    return user || null;
  }

  async findByTenantId(tenantId: string): Promise<UserResponse[]> {
    // All queries MUST include tenant_id filter for tenant isolation
    const users = await db(this.tableName)
      .where({ tenant_id: tenantId })
      .select('id', 'tenant_id', 'email', 'name', 'role', 'created_at');
    return users;
  }

  async countByTenantId(tenantId: string): Promise<number> {
    const result = await db(this.tableName)
      .where({ tenant_id: tenantId })
      .count('id as count')
      .first();
    return parseInt(result?.count as string) || 0;
  }

  async update(id: string, tenantId: string, data: Partial<User>): Promise<User | null> {
    // All queries MUST include tenant_id filter for tenant isolation
    const [user] = await db(this.tableName)
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return user || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    // All queries MUST include tenant_id filter for tenant isolation
    const deleted = await db(this.tableName)
      .where({ id, tenant_id: tenantId })
      .del();
    return deleted > 0;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }
}

export const userRepository = new UserRepository();
