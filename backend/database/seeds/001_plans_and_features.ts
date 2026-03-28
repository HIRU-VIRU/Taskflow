import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data with CASCADE to handle foreign key dependencies (like subscriptions)
  await knex.raw('TRUNCATE TABLE plan_feature_mappings CASCADE');
  await knex.raw('TRUNCATE TABLE plan_limits CASCADE');
  await knex.raw('TRUNCATE TABLE features CASCADE');
  await knex.raw('TRUNCATE TABLE plans CASCADE');

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
      {
        code: 'AI_SUMMARIZER',
        name: 'AI Project Summarizer',
        description: 'AI-powered project summary and insights',
      },
      {
        code: 'CREATE_TEAM',
        name: 'Create Teams',
        description: 'Ability to create and manage dedicated tenant teams',
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
    // Free Plan: CREATE_PROJECT, CREATE_TASK, INVITE_USER (up to 5 users)
    { plan_id: planMap['Free'], feature_id: featureMap['CREATE_PROJECT'] },
    { plan_id: planMap['Free'], feature_id: featureMap['CREATE_TASK'] },
    { plan_id: planMap['Free'], feature_id: featureMap['INVITE_USER'] },

    // Pro Plan: All features including AI_SUMMARIZER and CREATE_TEAM
    { plan_id: planMap['Pro'], feature_id: featureMap['CREATE_PROJECT'] },
    { plan_id: planMap['Pro'], feature_id: featureMap['CREATE_TASK'] },
    { plan_id: planMap['Pro'], feature_id: featureMap['INVITE_USER'] },
    { plan_id: planMap['Pro'], feature_id: featureMap['VIEW_ANALYTICS'] },
    { plan_id: planMap['Pro'], feature_id: featureMap['AI_SUMMARIZER'] },
    { plan_id: planMap['Pro'], feature_id: featureMap['CREATE_TEAM'] },

    // Enterprise Plan: All features including AI_SUMMARIZER and CREATE_TEAM
    { plan_id: planMap['Enterprise'], feature_id: featureMap['CREATE_PROJECT'] },
    { plan_id: planMap['Enterprise'], feature_id: featureMap['CREATE_TASK'] },
    { plan_id: planMap['Enterprise'], feature_id: featureMap['INVITE_USER'] },
    { plan_id: planMap['Enterprise'], feature_id: featureMap['VIEW_ANALYTICS'] },
    { plan_id: planMap['Enterprise'], feature_id: featureMap['AI_SUMMARIZER'] },
    { plan_id: planMap['Enterprise'], feature_id: featureMap['CREATE_TEAM'] },
  ]);

  // Insert Plan Limits
  await knex('plan_limits').insert([
    // Free Plan: max 3 projects, max 5 users, 1 AI summary (demo)
    { plan_id: planMap['Free'], limit_key: 'max_projects', limit_value: 3 },
    { plan_id: planMap['Free'], limit_key: 'max_users', limit_value: 5 },
    { plan_id: planMap['Free'], limit_key: 'max_ai_summaries', limit_value: 1 },

    // Pro Plan: max 20 projects, max 50 users, unlimited AI summaries
    { plan_id: planMap['Pro'], limit_key: 'max_projects', limit_value: 20 },
    { plan_id: planMap['Pro'], limit_key: 'max_users', limit_value: 50 },
    { plan_id: planMap['Pro'], limit_key: 'max_ai_summaries', limit_value: -1 },

    // Enterprise Plan: unlimited everything
    { plan_id: planMap['Enterprise'], limit_key: 'max_projects', limit_value: -1 },
    { plan_id: planMap['Enterprise'], limit_key: 'max_users', limit_value: -1 },
    { plan_id: planMap['Enterprise'], limit_key: 'max_ai_summaries', limit_value: -1 },
  ]);

  console.log('Seed completed: Plans, Features, and Mappings created');
}
