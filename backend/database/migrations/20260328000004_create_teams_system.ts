import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create teams table
  if (!(await knex.schema.hasTable('teams'))) {
    await knex.schema.createTable('teams', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.text('description');
      table.uuid('leader_id').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index('tenant_id');
      table.index('leader_id');
      table.unique(['tenant_id', 'name']); // Team names must be unique per tenant
    });
  }

  // Create team_members junction table
  if (!(await knex.schema.hasTable('team_members'))) {
    await knex.schema.createTable('team_members', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('role', 50).defaultTo('member'); // 'leader', 'member'
      table.timestamp('joined_at').defaultTo(knex.fn.now());

      table.unique(['team_id', 'user_id']); // User can only be in team once
      table.index('team_id');
      table.index('user_id');
    });
  }

  // Modify projects table to reference teams instead of individual leaders
  if (!(await knex.schema.hasColumn('projects', 'team_id'))) {
    await knex.schema.alterTable('projects', (table) => {
      table.uuid('team_id').references('id').inTable('teams').onDelete('SET NULL');
      table.index('team_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', (table) => {
    table.dropColumn('team_id');
  });

  await knex.schema.dropTableIfExists('team_members');
  await knex.schema.dropTableIfExists('teams');
}