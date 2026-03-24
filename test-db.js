const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'taskflow',
    password: 'postgres',
    port: 5432,
  });

  try {
    console.log('Attempting to connect to database...');
    await client.connect();
    console.log('✅ Database connection successful!');

    const result = await client.query('SELECT NOW()');
    console.log('✅ Query successful:', result.rows[0]);

    await client.end();
    console.log('✅ Connection closed gracefully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
}

testConnection();