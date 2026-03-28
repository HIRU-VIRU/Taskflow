import { db } from '../config/database';

async function runMigration() {
  try {
    console.log('🔄 Removing leader_id column from tasks table...');

    // Check if column exists first
    const hasColumn = await db.schema.hasColumn('tasks', 'leader_id');
    if (hasColumn) {
      await db.schema.alterTable('tasks', (table) => {
        table.dropColumn('leader_id');
      });
      console.log('✅ Successfully removed leader_id column from tasks table');
    } else {
      console.log('ℹ️  leader_id column does not exist in tasks table');
    }

    await db.destroy();
  } catch (error) {
    console.error('❌ Error removing leader_id column:', error);
    await db.destroy();
    process.exit(1);
  }
}

runMigration();