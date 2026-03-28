import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tasks', (table) => {
    table.uuid('leader_id').references('id').inTable('users').onDelete('SET NULL');
    table.index('leader_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tasks', (table) => {
    table.dropColumn('leader_id');
  });
}
