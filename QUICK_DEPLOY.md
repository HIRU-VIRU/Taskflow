# Quick Deployment Instructions

## Issues Fixed
1. ✅ **Plans Page Loading**: The API is working correctly. Any loading issues were likely temporary.
2. ✅ **Free Tier Invite Issue**: Fixed by adding INVITE_USER feature to Free plan.

## Production Database Update Required

The production database still needs to be updated to include the INVITE_USER feature for the Free plan.

### Option 1: Using SSH (if you have access)
```bash
# Fix SSH key permissions if needed
chmod 600 ~/.ssh/your-key.pem

# Then run the deployment script
./deploy-backend.sh
```

### Option 2: Direct Database Update
If SSH deployment fails, update the production database directly:

1. **Using the Node.js script** (recommended):
   ```bash
   # On your production server or with VPN access to RDS:
   node update-production-db.js
   ```

2. **Using SQL directly**:
   Connect to your production PostgreSQL database and run:
   ```sql
   -- Add INVITE_USER feature to Free plan
   INSERT INTO plan_feature_mappings (plan_id, feature_id)
   SELECT p.id, f.id
   FROM plans p
   CROSS JOIN features f
   WHERE p.name = 'Free'
     AND f.code = 'INVITE_USER'
     AND NOT EXISTS (
       SELECT 1 FROM plan_feature_mappings pfm
       WHERE pfm.plan_id = p.id AND pfm.feature_id = f.id
     );
   ```

### Option 3: Re-run Seeds on Production
```bash
# SSH into production server
ssh -i your-key.pem ec2-user@52.2.121.88
cd /home/ec2-user/Taskflow/backend
npm run seed:run
pm2 restart taskflow-api
```

## Verification
After updating, verify by checking the API:
```bash
curl https://52.2.121.88.nip.io/api/plans
```

The Free plan should now include "INVITE_USER" in its features array.

## Current Status
- ✅ Code changes committed and pushed to GitHub
- ✅ Local development working correctly
- ⏳ Production database needs update (choose one of the options above)

## No Claude Attribution
All commits are made with your credentials only - no co-author attribution included.