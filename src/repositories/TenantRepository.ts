import { db } from '../config/database';
import { Tenant, CreateTenantDTO } from '../types';

export class TenantRepository {
  private tableName = 'tenants';

  async create(data: CreateTenantDTO): Promise<Tenant> {
    const [tenant] = await db(this.tableName).insert(data).returning('*');
    return tenant;
  }

  async findById(id: string): Promise<Tenant | null> {
    const tenant = await db(this.tableName).where({ id }).first();
    return tenant || null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await db(this.tableName).where({ slug }).first();
    return tenant || null;
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant | null> {
    const [tenant] = await db(this.tableName)
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return tenant || null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db(this.tableName).where({ id }).del();
    return deleted > 0;
  }
}

export const tenantRepository = new TenantRepository();
