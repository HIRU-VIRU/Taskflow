import { db } from './backend/config/database';
import path from 'path';

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    // Run migrations
    const [batchNo, log] = await db.migrate.latest({
      directory: path.join(__dirname, 'backend/database/migrations'),
    });

    if (log.length === 0) {
      console.log('✅ Database is already up to date');
    } else {
      console.log('✅ Migrations completed successfully');
      console.log(`📝 Batch ${batchNo} run: ${log.length} migrations`);
      log.forEach((migration: string) => {
        console.log(`   - ${migration}`);
      });
    }

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await db.destroy();
    process.exit(1);
  }
}

runMigrations();