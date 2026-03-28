import { db } from '../config/database';

async function updateMigrationTracking() {
  try {
    console.log('📝 Updating migration tracking...');

    // Manually insert migration records for the migrations we just applied
    const migrations = [
      '20260328000001_create_invitations_table.ts',
      '20260328000002_add_leader_to_tasks.ts',
      '20260328000003_add_leader_to_projects.ts'
    ];

    for (const migration of migrations) {
      try {
        await db('knex_migrations').insert({
          name: migration,
          batch: 2,
          migration_time: new Date()
        });
        console.log(`✅ Marked ${migration} as completed`);
      } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⏭️  ${migration} already marked as completed`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Migration tracking updated successfully');
    await db.destroy();
  } catch (error) {
    console.error('❌ Error updating migration tracking:', error);
    await db.destroy();
    process.exit(1);
  }
}

updateMigrationTracking();