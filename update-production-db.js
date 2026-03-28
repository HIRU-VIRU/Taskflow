#!/usr/bin/env node

/**
 * Production Database Update Script
 * Adds INVITE_USER feature to Free plan
 *
 * Usage: node update-production-db.js
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function updateFreePlan() {
  try {
    console.log('🔌 Connecting to production database...');
    await client.connect();

    console.log('🔍 Checking current Free plan features...');
    const currentFeatures = await client.query(`
      SELECT f.code as feature_code
      FROM plans p
      JOIN plan_feature_mappings pfm ON p.id = pfm.plan_id
      JOIN features f ON pfm.feature_id = f.id
      WHERE p.name = 'Free'
      ORDER BY f.code
    `);

    console.log('Current Free plan features:', currentFeatures.rows.map(r => r.feature_code));

    // Check if INVITE_USER is already mapped
    const hasInviteFeature = currentFeatures.rows.some(row => row.feature_code === 'INVITE_USER');

    if (hasInviteFeature) {
      console.log('✅ Free plan already has INVITE_USER feature');
    } else {
      console.log('➕ Adding INVITE_USER feature to Free plan...');

      // Add the mapping
      await client.query(`
        INSERT INTO plan_feature_mappings (plan_id, feature_id)
        SELECT p.id as plan_id, f.id as feature_id
        FROM plans p
        CROSS JOIN features f
        WHERE p.name = 'Free'
          AND f.code = 'INVITE_USER'
      `);

      console.log('✅ Successfully added INVITE_USER feature to Free plan');
    }

    console.log('🔍 Verifying updated Free plan features...');
    const updatedFeatures = await client.query(`
      SELECT f.code as feature_code
      FROM plans p
      JOIN plan_feature_mappings pfm ON p.id = pfm.plan_id
      JOIN features f ON pfm.feature_id = f.id
      WHERE p.name = 'Free'
      ORDER BY f.code
    `);

    console.log('Updated Free plan features:', updatedFeatures.rows.map(r => r.feature_code));

    console.log('🎉 Production database update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating production database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the update
updateFreePlan();