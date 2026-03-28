import { db } from '../config/database';

async function checkTableStructure() {
  try {
    console.log('🔍 Checking database structure...');

    // Check if invitations table exists
    const invitationsExists = await db.schema.hasTable('invitations');
    console.log(`📋 Invitations table exists: ${invitationsExists}`);

    // Check if tasks table has leader_id column
    const tasksHasLeader = await db.schema.hasColumn('tasks', 'leader_id');
    console.log(`📋 Tasks table has leader_id: ${tasksHasLeader}`);

    // Check if projects table has leader_id column
    const projectsHasLeader = await db.schema.hasColumn('projects', 'leader_id');
    console.log(`📋 Projects table has leader_id: ${projectsHasLeader}`);

    // If projects table doesn't have leader_id, we need to add it
    if (!projectsHasLeader) {
      console.log('➕ Adding leader_id to projects table...');
      await db.schema.alterTable('projects', (table) => {
        table.uuid('leader_id').references('id').inTable('users').onDelete('SET NULL');
        table.index('leader_id');
      });
      console.log('✅ Added leader_id to projects table');
    }

    // If tasks table doesn't have leader_id, we need to add it
    if (!tasksHasLeader) {
      console.log('➕ Adding leader_id to tasks table...');
      await db.schema.alterTable('tasks', (table) => {
        table.uuid('leader_id').references('id').inTable('users').onDelete('SET NULL');
        table.index('leader_id');
      });
      console.log('✅ Added leader_id to tasks table');
    }

    console.log('✅ Database structure check completed');
    await db.destroy();
  } catch (error) {
    console.error('❌ Error checking database structure:', error);
    await db.destroy();
    process.exit(1);
  }
}

checkTableStructure();