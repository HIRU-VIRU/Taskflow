import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // 1. Tenants table
  await knex.schema.createTable('tenants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.string('slug', 100).notNullable().unique();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('email', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.string('role', 50).defaultTo('member');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['tenant_id', 'email']);
    table.index('tenant_id');
  });

  // 3. Plans table
  await knex.schema.createTable('plans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable().unique();
    table.text('description');
    table.decimal('price_monthly', 10, 2).defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 4. Features table
  await knex.schema.createTable('features', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('code', 50).notNullable().unique();
    table.string('name', 100).notNullable();
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 5. Plan Feature Mappings table
  await knex.schema.createTable('plan_feature_mappings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('plan_id').notNullable().references('id').inTable('plans').onDelete('CASCADE');
    table.uuid('feature_id').notNullable().references('id').inTable('features').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['plan_id', 'feature_id']);
    table.index('plan_id');
  });

  // 6. Plan Limits table
  await knex.schema.createTable('plan_limits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('plan_id').notNullable().references('id').inTable('plans').onDelete('CASCADE');
    table.string('limit_key', 50).notNullable();
    table.integer('limit_value').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['plan_id', 'limit_key']);
    table.index('plan_id');
  });

  // 7. Subscriptions table
  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('plan_id').notNullable().references('id').inTable('plans').onDelete('RESTRICT');
    table.string('status', 20).notNullable().defaultTo('ACTIVE');
    table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('tenant_id');
    table.index(['tenant_id', 'status']);
  });

  // 8. Projects table
  await knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('status', 20).defaultTo('active');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('tenant_id');
    table.index(['tenant_id', 'status']);
  });

  // 9. Tasks table
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('status', 20).defaultTo('todo');
    table.string('priority', 20).defaultTo('medium');
    table.uuid('assignee_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.date('due_date');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('project_id');
    table.index('tenant_id');
    table.index('assignee_id');
  });

  // 10. Usage Tracking table
  await knex.schema.createTable('usage_tracking', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('usage_key', 50).notNullable();
    table.integer('current_value').notNullable().defaultTo(0);
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['tenant_id', 'usage_key']);
    table.index('tenant_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('usage_tracking');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('projects');
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.schema.dropTableIfExists('plan_limits');
  await knex.schema.dropTableIfExists('plan_feature_mappings');
  await knex.schema.dropTableIfExists('features');
  await knex.schema.dropTableIfExists('plans');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('tenants');
}
