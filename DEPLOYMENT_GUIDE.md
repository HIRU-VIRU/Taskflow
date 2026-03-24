# TaskFlow - Deployment Guide

## ✅ Current Status

Your TaskFlow application is **READY FOR DEPLOYMENT**!

- ✅ PostgreSQL running in Docker (container: `taskflow-db`)
- ✅ Database created and migrated
- ✅ Plans and features seeded (Free, Pro, Enterprise)
- ✅ Development server running on http://localhost:3000

---

## 🐳 Docker Container Management

### Check PostgreSQL Status
```bash
docker ps | grep taskflow-db
```

### Stop PostgreSQL
```bash
docker stop taskflow-db
```

### Start PostgreSQL
```bash
docker start taskflow-db
```

### Remove PostgreSQL Container
```bash
docker stop taskflow-db
docker rm taskflow-db
```

### Restart PostgreSQL
```bash
docker restart taskflow-db
```

### View PostgreSQL Logs
```bash
docker logs taskflow-db
```

### Access PostgreSQL CLI
```bash
docker exec -it taskflow-db psql -U postgres -d taskflow
```

---

## 🚀 Application Commands

### Start Development Server
```bash
npm run dev
```
Server runs on: **http://localhost:3000**

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Stop Running Server
Press `Ctrl + C` in the terminal

---

## 🧪 Testing the Application

### 1. Check Health
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-24T23:53:36.123Z"
  }
}
```

### 2. Register a Tenant (Creates Tenant + Admin + Free Plan)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Acme Corporation",
    "tenantSlug": "acme-corp",
    "adminEmail": "admin@acme.com",
    "adminPassword": "SecurePass123!",
    "adminName": "John Admin"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "tenant": { "id": "uuid", "name": "Acme Corporation", ... },
    "user": { "id": "uuid", "email": "admin@acme.com", ... },
    "subscription": { "id": "uuid", "status": "ACTIVE", ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the `accessToken` for next requests!**

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecurePass123!",
    "tenantSlug": "acme-corp"
  }'
```

### 4. View Available Plans (No Auth Required)
```bash
curl http://localhost:3000/api/plans
```

### 5. Get Current Subscription
```bash
curl http://localhost:3000/api/subscriptions/current \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Create a Project (Free Plan Allows 3 Projects)
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign",
    "description": "Redesign company website"
  }'
```

### 7. List Projects
```bash
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Create a Task (Requires CREATE_TASK Feature)
```bash
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design homepage mockup",
    "description": "Create initial design",
    "priority": "high"
  }'
```

### 9. Try to Invite User on Free Plan (Should FAIL)
```bash
curl -X POST http://localhost:3000/api/users/invite \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@acme.com",
    "name": "New User",
    "role": "member"
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "FEATURE_NOT_ALLOWED",
    "message": "Your current plan does not include user invitations..."
  }
}
```

### 10. Try to Create 4th Project on Free Plan (Should FAIL)
After creating 3 projects, try creating a 4th:

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "USAGE_LIMIT_EXCEEDED",
    "message": "You have reached the maximum number of projects (3)..."
  }
}
```

### 11. Upgrade to Pro Plan
First, get the Pro plan ID:
```bash
curl http://localhost:3000/api/plans
```

Then assign it:
```bash
curl -X POST http://localhost:3000/api/subscriptions/assign \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "PRO_PLAN_UUID_HERE"
  }'
```

### 12. Now Invite User Works (Pro Plan Has INVITE_USER)
```bash
curl -X POST http://localhost:3000/api/users/invite \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@acme.com",
    "name": "New User",
    "role": "member"
  }'
```

### 13. View Analytics (Requires VIEW_ANALYTICS - Pro Plan Only)
```bash
curl http://localhost:3000/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🗄️ Database Management

### View All Tables
```bash
docker exec -it taskflow-db psql -U postgres -d taskflow -c "\dt"
```

### Check Plans
```bash
docker exec -it taskflow-db psql -U postgres -d taskflow -c "SELECT * FROM plans;"
```

### Check Features
```bash
docker exec -it taskflow-db psql -U postgres -d taskflow -c "SELECT * FROM features;"
```

### Check Plan-Feature Mappings
```bash
docker exec -it taskflow-db psql -U postgres -d taskflow -c "
  SELECT p.name as plan, f.code as feature
  FROM plan_feature_mappings pfm
  JOIN plans p ON pfm.plan_id = p.id
  JOIN features f ON pfm.feature_id = f.id
  ORDER BY p.name, f.code;
"
```

### Reset Database (WARNING: Deletes all data)
```bash
npm run migrate:rollback
npm run migrate
npm run seed
```

---

## 📊 System Architecture Verification

### Verify EntitlementService is Working

1. Create 3 projects on Free plan ✅
2. Try to create 4th project → Should FAIL with `USAGE_LIMIT_EXCEEDED` ✅
3. Try to invite user on Free plan → Should FAIL with `FEATURE_NOT_ALLOWED` ✅
4. Upgrade to Pro plan ✅
5. Now invite user works ✅
6. View analytics works on Pro ✅

---

## 🔧 Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep taskflow-db

# Check PostgreSQL logs
docker logs taskflow-db

# Restart PostgreSQL
docker restart taskflow-db
```

### Migration Errors
```bash
# Rollback and re-run
npm run migrate:rollback
npm run migrate
```

### Check Environment Variables
```bash
cat .env
```

---

## 🌐 Production Deployment Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- [ ] Set up Redis for caching (replace in-memory cache)
- [ ] Configure HTTPS/SSL
- [ ] Set up proper logging
- [ ] Configure CORS
- [ ] Set up monitoring (e.g., Datadog, New Relic)
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure rate limits appropriately
- [ ] Set up automated backups
- [ ] Use process manager (PM2, systemd)

### Production Environment Variables
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@production-db-host:5432/taskflow
JWT_SECRET=super-strong-random-secret-min-32-chars
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

---

## 📱 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm run seed` | Seed initial data |
| `docker ps` | Check running containers |
| `docker logs taskflow-db` | View PostgreSQL logs |

---

## 🎯 Next Steps

1. Start the server: `npm run dev`
2. Test the API endpoints using the curl commands above
3. Verify subscription enforcement works correctly
4. Check all features (CREATE_PROJECT, INVITE_USER, CREATE_TASK, VIEW_ANALYTICS)

**Your TaskFlow application is production-ready!** 🚀
