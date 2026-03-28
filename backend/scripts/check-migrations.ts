import { db } from '../config/database';

async function checkMigrationStatus() {
  try {
    console.log('🔍 Checking migration status...');

    // Check current migration status
    const completed = await db.migrate.currentVersion();
    console.log(`📝 Current migration version: ${completed}`);

    // List all pending migrations
    const [batchNo, log] = await db.migrate.list();

    if (log[0].length > 0) {
      console.log('✅ Completed migrations:');
      log[0].forEach((migration: string) => {
        console.log(`   ✓ ${migration}`);
      });
    }

    if (log[1].length > 0) {
      console.log('⏳ Pending migrations:');
      log[1].forEach((migration: string) => {
        console.log(`   - ${migration}`);
      });
    } else {
      console.log('✅ All migrations are up to date');
    }

    await db.destroy();
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    await db.destroy();
    process.exit(1);
  }
}

checkMigrationStatus();