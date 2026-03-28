import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // First ensure uuid-ossp extension exists (likely already there)
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('email', 255).notNullable();
    table.string('name', 255).notNullable();
    table.string('role', 50).defaultTo('member');
    table.string('token', 64).notNullable().unique();
    table.string('status', 20).notNullable().defaultTo('pending'); // pending, accepted, expired
    table.uuid('invited_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('expires_at').notNullable();
    table.timestamp('accepted_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes for common queries
    table.index('tenant_id');
    table.index('token');
    table.index('status');
    table.index(['tenant_id', 'email']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('invitations');
}
