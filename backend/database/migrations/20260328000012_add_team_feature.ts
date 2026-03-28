import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Insert the new CREATE_TEAM feature
  const [feature] = await knex('features')
    .insert({
      code: 'CREATE_TEAM',
      name: 'Create Teams',
      description: 'Ability to create and manage dedicated tenant teams',
    })
    .returning('*')
    .onConflict('code')
    .merge();

  // 2. Map the feature to Pro and Enterprise plans
  const plansToUpgrade = await knex('plans')
    .whereIn('name', ['Pro', 'Enterprise'])
    .select('id');

  if (plansToUpgrade.length > 0) {
    const mappings = plansToUpgrade.map((plan) => ({
      plan_id: plan.id,
      feature_id: feature.id,
    }));
    
    // Ignore if they already exist
    await knex('plan_feature_mappings')
      .insert(mappings)
      .onConflict(['plan_id', 'feature_id'])
      .ignore();
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove the mappings and the feature
  const feature = await knex('features').where({ code: 'CREATE_TEAM' }).first();
  if (feature) {
    await knex('plan_feature_mappings').where({ feature_id: feature.id }).del();
    await knex('features').where({ id: feature.id }).del();
  }
}
