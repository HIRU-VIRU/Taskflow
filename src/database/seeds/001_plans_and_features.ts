import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('plan_feature_mappings').del();
  await knex('plan_limits').del();
  await knex('features').del();
  await knex('plans').del();

  // Insert Features
  const features = await knex('features')
    .insert([
      {
        code: 'CREATE_PROJECT',
        name: 'Create Project',
        description: 'Ability to create new projects',
      },
      {
        code: 'CREATE_TASK',
        name: 'Create Task',
        description: 'Ability to create tasks within projects',
      },
      {
        code: 'INVITE_USER',
        name: 'Invite User',
        description: 'Ability to invite users to the tenant',
      },
      {
        code: 'VIEW_ANALYTICS',
        name: 'View Analytics',
        description: 'Access to analytics dashboard',
      },
    ])
    .returning('*');

  const featureMap = features.reduce((acc, f) => {
    acc[f.code] = f.id;
    return acc;
  }, {} as Record<string, string>);

  // Insert Plans
  const plans = await knex('plans')
    .insert([
      {
        name: 'Free',
        description: 'Free plan with basic features',
        price_monthly: 0,
        is_active: true,
      },
      {
        name: 'Pro',
        description: 'Professional plan with advanced features',
        price_monthly: 29.99,
        is_active: true,
      },
      {
        name: 'Enterprise',
        description: 'Enterprise plan with unlimited features',
        price_monthly: 99.99,
        is_active: true,
      },
    ])
    .returning('*');

  const planMap = plans.reduce((acc, p) => {
    acc[p.name] = p.id;
    return acc;
  }, {} as Record<string, string>);

  // Insert Plan Feature Mappings
  await knex('plan_feature_mappings').insert([
    // Free Plan: CREATE_PROJECT, CREATE_TASK
    { plan_id: planMap['Free'], feature_id: featureMap['CREATE_PROJECT'] },
    { plan_id: planMap['Free'], feature_id: featureMap['CREATE_TASK'] },

    // Pro Plan: All features
    { plan_id: planMap['Pro'], feature_id: featureMap['CREATE_PROJECT'] },
    { plan_id: planMap['Pro'], feature_id: featureMap['CREATE_TASK'] },
    { plan_id: planMap['Pro'], feature_id: featureMap['INVITE_USER'] },
    { plan_id: planMap['Pro'], feature_id: featureMap['VIEW_ANALYTICS'] },

    // Enterprise Plan: All features
    { plan_id: planMap['Enterprise'], feature_id: featureMap['CREATE_PROJECT'] },
    { plan_id: planMap['Enterprise'], feature_id: featureMap['CREATE_TASK'] },
    { plan_id: planMap['Enterprise'], feature_id: featureMap['INVITE_USER'] },
    { plan_id: planMap['Enterprise'], feature_id: featureMap['VIEW_ANALYTICS'] },
  ]);

  // Insert Plan Limits
  await knex('plan_limits').insert([
    // Free Plan: max 3 projects, max 5 users
    { plan_id: planMap['Free'], limit_key: 'max_projects', limit_value: 3 },
    { plan_id: planMap['Free'], limit_key: 'max_users', limit_value: 5 },

    // Pro Plan: max 20 projects, max 50 users
    { plan_id: planMap['Pro'], limit_key: 'max_projects', limit_value: 20 },
    { plan_id: planMap['Pro'], limit_key: 'max_users', limit_value: 50 },

    // Enterprise Plan: unlimited (-1)
    { plan_id: planMap['Enterprise'], limit_key: 'max_projects', limit_value: -1 },
    { plan_id: planMap['Enterprise'], limit_key: 'max_users', limit_value: -1 },
  ]);

  console.log('Seed completed: Plans, Features, and Mappings created');
}
