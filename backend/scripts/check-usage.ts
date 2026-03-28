import { db } from '../config/database';

async function checkUsageAndLimits() {
  try {
    console.log('🔍 Checking current usage and plan limits...');

    // Get all usage data
    const usage = await db('usage_tracking').select('*');
    console.log('📊 Current usage:', usage);

    // Get all plans with their limits
    const plans = await db('plans').select('*');
    console.log('📋 Available plans:', plans);

    // Get plan limits
    const limits = await db('plan_limits').select('*');
    console.log('🎯 Plan limits:', limits);

    // Get current active subscriptions
    const subscriptions = await db('subscriptions')
      .where('status', 'ACTIVE')
      .select('*');
    console.log('🔔 Active subscriptions:', subscriptions);

    await db.destroy();
  } catch (error) {
    console.error('❌ Error checking usage:', error);
    await db.destroy();
    process.exit(1);
  }
}

checkUsageAndLimits();