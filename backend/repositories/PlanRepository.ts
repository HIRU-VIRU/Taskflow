import { db } from '../config/database';
import { Plan, PlanLimit } from '../types';

export class PlanRepository {
  private tableName = 'plans';

  async findAll(activeOnly = true): Promise<Plan[]> {
    let query = db(this.tableName);
    if (activeOnly) {
      query = query.where({ is_active: true });
    }
    return query.select('*');
  }

  async findAllActive(): Promise<Plan[]> {
    return this.findAll(true);
  }

  async findById(id: string): Promise<Plan | null> {
    const plan = await db(this.tableName).where({ id }).first();
    return plan || null;
  }

  async findByName(name: string): Promise<Plan | null> {
    const plan = await db(this.tableName).where({ name }).first();
    return plan || null;
  }

  async getFeatures(planId: string): Promise<string[]> {
    const features = await db('plan_feature_mappings')
      .join('features', 'plan_feature_mappings.feature_id', 'features.id')
      .where('plan_feature_mappings.plan_id', planId)
      .select('features.code');
    return features.map((f) => f.code);
  }

  async getLimits(planId: string): Promise<Record<string, number>> {
    const limits = await db('plan_limits')
      .where({ plan_id: planId })
      .select('limit_key', 'limit_value');
    return limits.reduce((acc, l) => {
      acc[l.limit_key] = l.limit_value;
      return acc;
    }, {} as Record<string, number>);
  }

  async getLimit(planId: string, limitKey: string): Promise<number | null> {
    const limit = await db<PlanLimit>('plan_limits')
      .where({ plan_id: planId, limit_key: limitKey })
      .first();
    return limit ? limit.limit_value : null;
  }

  async hasFeature(planId: string, featureCode: string): Promise<boolean> {
    const mapping = await db('plan_feature_mappings')
      .join('features', 'plan_feature_mappings.feature_id', 'features.id')
      .where({
        'plan_feature_mappings.plan_id': planId,
        'features.code': featureCode,
      })
      .first();
    return !!mapping;
  }

  async getPlansWithDetails(): Promise<Array<Plan & { features: string[]; limits: Record<string, number> }>> {
    const plans = await this.findAll();
    return Promise.all(
      plans.map(async (plan) => ({
        ...plan,
        features: await this.getFeatures(plan.id),
        limits: await this.getLimits(plan.id),
      }))
    );
  }
}

export const planRepository = new PlanRepository();
