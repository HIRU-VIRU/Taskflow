import { db } from '../config/database';
import { PlatformAdmin } from '../types';
import bcrypt from 'bcryptjs';

export class PlatformAdminRepository {
  private tableName = 'platform_admins';

  async findByEmail(email: string): Promise<PlatformAdmin | null> {
    const admin = await db(this.tableName).where({ email }).first();
    return admin || null;
  }

  async findById(id: string): Promise<PlatformAdmin | null> {
    const admin = await db(this.tableName).where({ id }).first();
    return admin || null;
  }

  async create(data: { email: string; password: string; name: string }): Promise<PlatformAdmin> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const [admin] = await db(this.tableName)
      .insert({ email: data.email, password_hash: passwordHash, name: data.name })
      .returning('*');
    return admin;
  }

  async verifyPassword(admin: PlatformAdmin, password: string): Promise<boolean> {
    return bcrypt.compare(password, admin.password_hash);
  }

  async findAll(): Promise<Omit<PlatformAdmin, 'password_hash'>[]> {
    return db(this.tableName).select('id', 'email', 'name', 'created_at', 'updated_at');
  }
}

export const platformAdminRepository = new PlatformAdminRepository();
