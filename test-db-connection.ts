import { db } from './src/config/database';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');

  try {
    // Test basic connection
    console.log('⏳ Attempting to connect...');
    const result = await db.raw('SELECT NOW() as current_time, version()');

    console.log('✅ Database connection successful!');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🗄️  Database version:', result.rows[0].version.split('\n')[0]);

    // Test if our tables exist
    console.log('\n🔍 Checking tables...');
    const tables = await db.raw(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📋 Available tables:', tables.rows.map(r => r.table_name).join(', '));

    // Test a simple query
    console.log('\n🔍 Testing simple query...');
    const plans = await db('plans').select('name', 'price_monthly').limit(3);
    console.log('📊 Sample plans:', plans);

    console.log('\n✅ All database tests passed!');
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await db.destroy();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
}

testDatabaseConnection();