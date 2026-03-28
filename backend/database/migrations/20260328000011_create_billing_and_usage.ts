import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Billing events table — immutable ledger of subscription lifecycle events
  await knex.schema.createTable('billing_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('subscription_id').nullable().references('id').inTable('subscriptions').onDelete('SET NULL');
    table.uuid('plan_id').nullable().references('id').inTable('plans').onDelete('SET NULL');
    // event_type: payment | upgrade | downgrade | cancellation | renewal | refund | trial_start
    table.string('event_type', 50).notNullable();
    table.decimal('amount', 10, 2).notNullable().defaultTo(0);
    table.text('description').nullable();
    table.timestamp('period_start').nullable();
    table.timestamp('period_end').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('tenant_id');
    table.index(['tenant_id', 'event_type']);
    table.index('created_at');
  });

  // Usage snapshots table — daily sampled historical usage for graphs
  await knex.schema.createTable('usage_snapshots', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('usage_key', 50).notNullable(); // project_count | user_count
    table.integer('value').notNullable().defaultTo(0);
    table.date('snapshot_date').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['tenant_id', 'usage_key', 'snapshot_date']);
    table.index('tenant_id');
    table.index('snapshot_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('usage_snapshots');
  await knex.schema.dropTableIfExists('billing_events');
}
