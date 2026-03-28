import { db } from '../config/database';

async function applyTeamsSystemMigration() {
  try {
    console.log('🔄 Applying teams system migration...');

    // Check if teams table exists
    const teamsExists = await db.schema.hasTable('teams');
    if (!teamsExists) {
      console.log('➕ Creating teams table...');
      await db.schema.createTable('teams', (table) => {
        table.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'));
        table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        table.string('name', 255).notNullable();
        table.text('description');
        table.uuid('leader_id').references('id').inTable('users').onDelete('SET NULL');
        table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());

        table.index('tenant_id');
        table.index('leader_id');
        table.unique(['tenant_id', 'name']);
      });
      console.log('✅ Teams table created');
    } else {
      console.log('ℹ️ Teams table already exists');
    }

    // Check if team_members table exists
    const teamMembersExists = await db.schema.hasTable('team_members');
    if (!teamMembersExists) {
      console.log('➕ Creating team_members table...');
      await db.schema.createTable('team_members', (table) => {
        table.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'));
        table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('role', 50).defaultTo('member');
        table.timestamp('joined_at').defaultTo(db.fn.now());

        table.unique(['team_id', 'user_id']);
        table.index('team_id');
        table.index('user_id');
      });
      console.log('✅ Team members table created');
    } else {
      console.log('ℹ️ Team members table already exists');
    }

    // Check if projects table has team_id column
    const projectsHasTeamId = await db.schema.hasColumn('projects', 'team_id');
    if (!projectsHasTeamId) {
      console.log('➕ Adding team_id to projects table...');
      await db.schema.alterTable('projects', (table) => {
        table.uuid('team_id').references('id').inTable('teams').onDelete('SET NULL');
        table.index('team_id');
      });
      console.log('✅ Team ID added to projects table');
    } else {
      console.log('ℹ️ Projects table already has team_id');
    }

    // Update migration tracking
    await db('knex_migrations').insert({
      name: '20260328000004_create_teams_system.ts',
      batch: 3,
      migration_time: new Date()
    }).onConflict('name').ignore();

    console.log('✅ Teams system migration completed successfully');
    await db.destroy();
  } catch (error) {
    console.error('❌ Teams system migration failed:', error);
    await db.destroy();
    process.exit(1);
  }
}

applyTeamsSystemMigration();