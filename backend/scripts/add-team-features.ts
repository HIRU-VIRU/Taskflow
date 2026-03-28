import { db } from '../config/database';

async function addTeamFeaturesToPlans() {
  try {
    console.log('🔄 Adding team management features to plans...');

    // Check if CREATE_TEAM feature exists
    const createTeamFeature = await db('features')
      .where('code', 'CREATE_TEAM')
      .first();

    if (!createTeamFeature) {
      console.log('➕ Adding CREATE_TEAM feature...');
      const [feature] = await db('features')
        .insert({
          code: 'CREATE_TEAM',
          name: 'Create Teams',
          description: 'Ability to create and manage teams',
        })
        .returning('*');

      // Add to all plans (teams are available on all plans)
      const plans = await db('plans').select('id');
      for (const plan of plans) {
        await db('plan_feature_mappings')
          .insert({
            plan_id: plan.id,
            feature_id: feature.id,
          })
          .onConflict(['plan_id', 'feature_id'])
          .ignore();
      }
      console.log('✅ CREATE_TEAM feature added to all plans');
    } else {
      console.log('ℹ️ CREATE_TEAM feature already exists');
    }

    console.log('✅ Team features setup completed');
    await db.destroy();
  } catch (error) {
    console.error('❌ Error setting up team features:', error);
    await db.destroy();
    process.exit(1);
  }
}

addTeamFeaturesToPlans();