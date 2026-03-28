import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

/**
 * Demo seed: 8 realistic tenants with users, projects, tasks,
 * 12 months of billing events, and 60-day usage snapshots.
 * Produces rich data for platform admin visualizations.
 */
export async function seed(knex: Knex): Promise<void> {
  // ── Clear existing demo data (preserve plan/feature data from seed 001) ─────
  await knex('usage_snapshots').del();
  await knex('billing_events').del();
  await knex('usage_tracking').del();
  await knex('tasks').del();
  await knex('projects').del();
  await knex('team_members').del().catch(() => {});
  await knex('teams').del().catch(() => {});
  await knex('invitations').del().catch(() => {});
  await knex('subscriptions').del();
  await knex('users').del();
  await knex('tenants').del();

  // ── Load plan IDs ─────────────────────────────────────────────────────────
  const plans = await knex('plans').select('id', 'name', 'price_monthly');
  const planMap: Record<string, { id: string; price: number }> = {};
  plans.forEach((p) => {
    planMap[p.name] = { id: p.id, price: parseFloat(p.price_monthly) };
  });

  const hashPw = async (pw: string) => bcrypt.hash(pw, 10);
  const now = new Date();

  // ── Tenant definitions ────────────────────────────────────────────────────
  // monthsAgo: when they joined. plan: starting plan. upgradedTo: optional later plan
  const tenantDefs = [
    { name: 'Acme Corporation',    slug: 'acme-corp',       plan: 'Enterprise', monthsAgo: 14, users: 45, projects: 28, tasks: 312 },
    { name: 'TechStart Inc',       slug: 'techstart-inc',   plan: 'Pro',        monthsAgo: 8,  users: 18, projects: 12, tasks: 134 },
    { name: 'DesignHub Studio',    slug: 'designhub',       plan: 'Pro',        monthsAgo: 6,  users: 22, projects: 15, tasks: 178 },
    { name: 'ByteForge Labs',      slug: 'byteforge-labs',  plan: 'Free',       monthsAgo: 3,  users: 4,  projects: 2,  tasks: 18  },
    { name: 'CloudNine Solutions', slug: 'cloudnine',       plan: 'Enterprise', monthsAgo: 10, users: 67, projects: 42, tasks: 521 },
    { name: 'Greenwave Tech',      slug: 'greenwave-tech',  plan: 'Pro',        monthsAgo: 4,  users: 11, projects: 8,  tasks: 89  },
    { name: 'MicroSystems Co',     slug: 'microsystems-co', plan: 'Free',       monthsAgo: 1,  users: 2,  projects: 1,  tasks: 7   },
    { name: 'NexGen AI',           slug: 'nexgen-ai',       plan: 'Enterprise', monthsAgo: 14, users: 89, projects: 55, tasks: 743 },
  ];

  for (const def of tenantDefs) {
    const joinedAt = new Date(now.getFullYear(), now.getMonth() - def.monthsAgo, 1);
    const plan = planMap[def.plan];
    if (!plan) continue;

    // 1. Create tenant
    const [tenant] = await knex('tenants')
      .insert({ name: def.name, slug: def.slug, created_at: joinedAt, updated_at: joinedAt })
      .returning('*');

    // 2. Admin user
    const [adminUser] = await knex('users')
      .insert({
        tenant_id: tenant.id,
        email: `admin@${def.slug}.com`,
        password_hash: await hashPw('Demo@1234'),
        name: `Admin ${def.name}`,
        role: 'admin',
        created_at: joinedAt,
        updated_at: joinedAt,
      })
      .returning('*');

    // 3. Create subscription
    const [subscription] = await knex('subscriptions')
      .insert({
        tenant_id: tenant.id,
        plan_id: plan.id,
        status: 'ACTIVE',
        started_at: joinedAt,
        expires_at: null,
        created_at: joinedAt,
        updated_at: joinedAt,
      })
      .returning('*');

    // 4. Usage tracking seed values
    await knex('usage_tracking').insert([
      { tenant_id: tenant.id, usage_key: 'project_count', current_value: def.projects },
      { tenant_id: tenant.id, usage_key: 'user_count', current_value: def.users },
    ]);

    // 5. Create projects (up to 5 actual project rows for FKs; rest are just counts)
    const projectsToInsert = Math.min(def.projects, 5);
    const projectIds: string[] = [];
    for (let i = 0; i < projectsToInsert; i++) {
      const projectCreatedAt = new Date(
        joinedAt.getTime() + (i * 7 * 24 * 60 * 60 * 1000)
      );
      const [proj] = await knex('projects')
        .insert({
          tenant_id: tenant.id,
          name: `Project ${i + 1} — ${def.name}`,
          description: `Core initiative ${i + 1} for ${def.name}`,
          status: i === 0 ? 'archived' : 'active',
          created_by: adminUser.id,
          created_at: projectCreatedAt,
          updated_at: projectCreatedAt,
        })
        .returning('*');
      projectIds.push(proj.id);
    }

    // 6. Create tasks for each project
    const statuses: string[] = ['todo', 'in_progress', 'done'];
    const priorities: string[] = ['low', 'medium', 'high'];
    for (const projectId of projectIds) {
      const taskCount = Math.floor(def.tasks / projectsToInsert);
      const batchSize = 20;
      const actualTasks = Math.min(taskCount, batchSize);
      const taskRows = Array.from({ length: actualTasks }, (_, j) => ({
        project_id: projectId,
        tenant_id: tenant.id,
        title: `Task ${j + 1}`,
        description: `Work item ${j + 1}`,
        status: statuses[j % 3],
        priority: priorities[j % 3],
        assignee_id: adminUser.id,
        created_by: adminUser.id,
        created_at: new Date(joinedAt.getTime() + j * 12 * 60 * 60 * 1000),
        updated_at: new Date(joinedAt.getTime() + j * 12 * 60 * 60 * 1000),
      }));
      if (taskRows.length > 0) await knex('tasks').insert(taskRows);
    }

    // 7. Billing events — one per month since joining
    const monthsActive = def.monthsAgo;
    for (let m = 0; m < monthsActive; m++) {
      const eventDate = new Date(joinedAt.getFullYear(), joinedAt.getMonth() + m, 15);
      if (eventDate > now) break;

      const isFirst = m === 0;
      const eventType = isFirst ? 'upgrade' : 'payment';
      const amount = def.plan === 'Free' ? 0 : plan.price;

      if (amount > 0 || isFirst) {
        const periodStart = new Date(joinedAt.getFullYear(), joinedAt.getMonth() + m, 1);
        const periodEnd = new Date(joinedAt.getFullYear(), joinedAt.getMonth() + m + 1, 0);

        await knex('billing_events').insert({
          tenant_id: tenant.id,
          subscription_id: subscription.id,
          plan_id: plan.id,
          event_type: eventType,
          amount: amount,
          description: isFirst
            ? `Subscribed to ${def.plan} plan`
            : `Monthly ${def.plan} plan — ${periodStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          period_start: periodStart,
          period_end: periodEnd,
          created_at: eventDate,
        });
      }
    }

    // 8. Usage snapshots — daily for past 60 days
    const snapshotDays = 60;
    for (let d = snapshotDays; d >= 0; d--) {
      const snapshotDate = new Date(now);
      snapshotDate.setDate(snapshotDate.getDate() - d);

      // Skip dates before tenant joined
      if (snapshotDate < joinedAt) continue;

      const daysFraction = (snapshotDays - d) / snapshotDays;
      const projectValue = Math.floor(def.projects * daysFraction + 1);
      const userValue = Math.floor(def.users * daysFraction + 1);
      const dateStr = snapshotDate.toISOString().split('T')[0];

      await knex('usage_snapshots')
        .insert([
          { tenant_id: tenant.id, usage_key: 'project_count', value: Math.min(projectValue, def.projects), snapshot_date: dateStr },
          { tenant_id: tenant.id, usage_key: 'user_count', value: Math.min(userValue, def.users), snapshot_date: dateStr },
        ])
        .onConflict(['tenant_id', 'usage_key', 'snapshot_date'])
        .merge();
    }

    console.log(`  ✅ Created tenant: ${def.name} (${def.plan}, ${def.monthsAgo}mo old)`);
  }

  // ── Platform Admin account ────────────────────────────────────────────────
  await knex('platform_admins')
    .insert({
      email: 'admin@taskflow.platform',
      password_hash: await hashPw('SuperOwner@123'),
      name: 'Platform Admin',
    })
    .onConflict('email')
    .merge({ name: 'Platform Admin' });

  console.log('\n✅ Demo seed complete!');
  console.log('   Platform Admin: admin@taskflow.platform / SuperOwner@123');
  console.log('   Tenant admins: admin@<slug>.com / Demo@1234');
}
