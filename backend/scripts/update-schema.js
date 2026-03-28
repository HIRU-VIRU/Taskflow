const { db } = require('./config/database');

async function updateSchema() {
  try {
    console.log('🔄 Starting database schema update...');

    // Check and add leader_id to projects table
    const hasProjectLeader = await db.schema.hasColumn('projects', 'leader_id');
    if (!hasProjectLeader) {
      console.log('➕ Adding leader_id column to projects table...');
      await db.schema.alterTable('projects', (table) => {
        table.uuid('leader_id').references('id').inTable('users').onDelete('SET NULL');
        table.index('leader_id');
      });
      console.log('✅ Added leader_id to projects table');
    } else {
      console.log('ℹ️ projects.leader_id already exists');
    }

    // Check and add leader_id to tasks table (if migration was created)
    const hasTaskLeader = await db.schema.hasColumn('tasks', 'leader_id');
    if (!hasTaskLeader) {
      console.log('➕ Adding leader_id column to tasks table...');
      await db.schema.alterTable('tasks', (table) => {
        table.uuid('leader_id').references('id').inTable('users').onDelete('SET NULL');
        table.index('leader_id');
      });
      console.log('✅ Added leader_id to tasks table');
    } else {
      console.log('ℹ️ tasks.leader_id already exists');
    }

    console.log('🎉 Schema update completed successfully!');

  } catch (error) {
    console.error('❌ Schema update failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

updateSchema()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error.message);
    process.exit(1);
  });