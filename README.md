# 🚀 TaskFlow - Multi-Tenant Project Management SaaS

A production-ready multi-tenant Project Management SaaS application with subscription-based access control, feature entitlements, and usage limits.

## 📋 Quick Links

- 🌐 **[Live Demo](https://frontend-taskflow-18-three.vercel.app)** - Try the application now!
- 📖 **[Demo Guide](./docs/demo-guide.md)** - Learn how to use the demo
- 🛠️ **[Development Setup](./docs/development-setup.md)** - Set up locally for development

## ✨ Key Features

- **🏢 Multi-Tenancy**: Complete tenant isolation with shared infrastructure
- **📊 SaaS Subscriptions**: Database-driven plans with feature & usage controls
- **🔐 JWT Authentication**: Stateless authentication for scalability
- **⚡ Modern Stack**: React 18 + TypeScript + Node.js + PostgreSQL
- **🌐 Production Ready**: Deployed on Vercel + AWS with SSL

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│           React Frontend (Vercel)           │
│         TypeScript + Tailwind CSS          │
└─────────────────────────────────────────────┘
                     │ HTTPS/CORS
                     ▼
┌─────────────────────────────────────────────┐
│       Express API Server (AWS EC2)         │
│   Rate Limiting → Auth → Entitlements      │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│       PostgreSQL Database (AWS RDS)        │
│         Multi-tenant with SSL              │
└─────────────────────────────────────────────┘
```

## 📁 Project Structure

```
Taskflow/
├── 📚 docs/                    # Documentation
│   ├── 🎯 demo-guide.md        # Live demo walkthrough
│   └── 🛠️ development-setup.md  # Local development guide
├── 🔧 scripts/                 # Deployment & utility scripts
├── 🖥️ backend/                 # Node.js API server
│   ├── controllers/            # Request handlers
│   ├── services/              # Business logic
│   ├── repositories/          # Database access
│   └── middleware/            # Authentication & entitlements
├── 🌐 frontend/                # React application
│   ├── src/components/        # UI components
│   ├── src/contexts/          # State management
│   └── src/pages/             # Application pages
└── 📋 package.json             # Root management scripts
```

## 🎯 Subscription Plans

| Plan | Price | Projects | Users | Features |
|------|-------|----------|-------|----------|
| **Free** | $0/month | 3 | 5 | Basic project management |
| **Pro** | $29.99/month | 20 | 50 | + User invites, Analytics |
| **Enterprise** | $99.99/month | Unlimited | Unlimited | + All features |

## 🚀 Quick Start Options

### Option 1: Try the Live Demo
1. Visit: [https://frontend-taskflow-18-three.vercel.app](https://frontend-taskflow-18-three.vercel.app)
2. Follow the [Demo Guide](./docs/demo-guide.md) for login credentials
3. Explore all SaaS features and multi-tenancy

### Option 2: Local Development
1. Follow the [Development Setup Guide](./docs/development-setup.md)
2. Clone, install dependencies, and start servers
3. Create your own tenants and test locally

## 🔐 Security & Best Practices

- ✅ **JWT Authentication** with configurable expiration
- ✅ **Password Hashing** with bcrypt (10 rounds)
- ✅ **Tenant Isolation** at database layer (all queries include tenant_id)
- ✅ **Rate Limiting** per tenant with configurable limits
- ✅ **Input Validation** with Zod schemas
- ✅ **SQL Injection Prevention** with parameterized queries
- ✅ **CORS Protection** with origin whitelisting
- ✅ **HTTPS Everywhere** in production with Let's Encrypt

## 🛠️ Management Commands

```bash
# Install dependencies
npm run install:all          # Install both backend & frontend

# Development
npm run dev                  # Start backend server
npm run frontend:dev         # Start frontend server

# Database
npm run db:start            # Start PostgreSQL (Docker)
npm run db:setup            # Run migrations & seeds

# Build & Deploy
npm run build:all           # Build both projects
./scripts/deploy-backend.sh # Deploy to production
```

## 🎨 Technical Highlights

### Clean Architecture
- **Controller → Service → Repository** pattern
- **Centralized Entitlement Service** for feature gating
- **Database-driven subscriptions** (no hardcoded plans)

### Modern Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive design
- **React Router** for client-side routing
- **Context API** for state management

### Scalable Backend
- **Express.js** with TypeScript
- **Knex.js** for database migrations & queries
- **JWT** for stateless authentication
- **Rate limiting** and request timeout protection

## 📄 License

MIT License - Feel free to use this project as a template for your own SaaS applications.

## 🌟 Built With

**Frontend:** React 18 • TypeScript • Tailwind CSS • Vite
**Backend:** Node.js • Express • PostgreSQL • Knex.js
**Infrastructure:** Vercel • AWS EC2 • AWS RDS • Let's Encrypt

---

**Ready to explore?** 🚀 Start with the [Live Demo](https://frontend-taskflow-18-three.vercel.app) or [Development Setup](./docs/development-setup.md)!

## 🛠️ Available Scripts

### Root Management Scripts

```bash
npm run backend:install    # Install backend dependencies
npm run backend:dev        # Start backend development server
npm run backend:build      # Build backend for production
npm run backend:start      # Start backend production server

npm run frontend:install   # Install frontend dependencies
npm run frontend:dev       # Start frontend development server
npm run frontend:build     # Build frontend for production
npm run frontend:preview   # Preview frontend production build

npm run install:all        # Install both backend + frontend dependencies
npm run build:all          # Build both projects for production

npm run dev                # Start backend (shorthand)

# Database Management Scripts
npm run db:start           # Start PostgreSQL container (create or start existing)
npm run db:stop            # Stop PostgreSQL container (keeps data)
npm run db:setup           # Run migrations + seeds (setup database schema)
```

### Backend Commands (from `backend/` directory)

```bash
cd backend

npm run dev                # Start development server with hot reload
npm run debug              # Start with debug mode
npm run build              # Build TypeScript to JavaScript
npm run start              # Start production server (requires build)
npm run migrate            # Run database migrations
npm run migrate:rollback   # Rollback last migration
npm run seed               # Seed initial data
```

### Frontend Commands (from `frontend/` directory)

```bash
cd frontend

npm run dev                # Start Vite development server
npm run build              # Build for production
npm run preview            # Preview production build locally
npm run lint               # Lint code with ESLint
```

### Database Management

#### Quick Start/Stop Commands

```bash
# Start database (creates new or starts existing container)
npm run db:start
# OR manually:
# docker start taskflow-db (if container exists)

# Stop database (keeps container and data)
npm run db:stop
# OR manually:
# docker stop taskflow-db

# Setup database schema and initial data
npm run db:setup
```

#### Database Container Management

```bash
# Check container status
docker ps -a | grep taskflow-db

# Start existing stopped container
docker start taskflow-db

# Stop running container
docker stop taskflow-db

# Remove container completely (loses all data)
docker rm taskflow-db

# View container logs
docker logs taskflow-db --tail 20

# Connect to database shell
docker exec -it taskflow-db psql -U postgres -d taskflow
```

#### Database Schema Management

```bash
# Run from project root
npm run db:setup           # Run migrations + seeds

# OR run from backend/ directory
cd backend
npm run migrate            # Run pending migrations
npm run migrate:rollback   # Rollback last migration batch
npm run seed               # Run seed files (plans, features, etc.)
```

#### Common Database Issues

**Connection Refused Error:**
1. Check if container is running: `docker ps | grep taskflow-db`
2. Start container if stopped: `docker start taskflow-db`
3. Wait 5-10 seconds for database to be ready
4. Check logs: `docker logs taskflow-db --tail 10`

**Container Name Conflicts:**
```bash
# If you get "container name already in use"
docker rm taskflow-db     # Remove existing container
npm run db:start          # Create new container
npm run db:setup          # Setup schema and data
```

**Reset Database Completely:**
```bash
docker stop taskflow-db
docker rm taskflow-db
npm run db:start
npm run db:setup
```

## 📊 Default Plans

| Plan | Price | Features | Limits |
|------|-------|----------|--------|
| Free | $0 | CREATE_PROJECT, CREATE_TASK | 3 projects, 5 users |
| Pro | $29.99 | All features | 20 projects, 50 users |
| Enterprise | $99.99 | All features | Unlimited |

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new tenant
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Archive project

### Tasks
- `GET /api/projects/:id/tasks` - List tasks
- `POST /api/projects/:id/tasks` - Create task
- `PUT /api/projects/:id/tasks/:taskId` - Update task
- `DELETE /api/projects/:id/tasks/:taskId` - Delete task

### Users
- `GET /api/users` - List users
- `POST /api/users/invite` - Invite user (admin only)
- `DELETE /api/users/:id` - Remove user (admin only)

### Subscriptions
- `GET /api/plans` - List available plans
- `GET /api/subscriptions/current` - Get current subscription
- `POST /api/subscriptions/assign` - Change plan (admin only)

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard stats

## 🧪 Quick Test

```bash
# Make sure servers are running:
# Terminal 1: npm run dev (backend)
# Terminal 2: npm run frontend:dev (frontend)

# Register a tenant
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{
    "tenantName": "Test Corp",
    "tenantSlug": "test-corp",
    "adminEmail": "admin@test.com",
    "adminPassword": "password123",
    "adminName": "Admin User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "tenantSlug": "test-corp"
  }'

# Test CORS preflight (should return 204)
curl -X OPTIONS http://localhost:3000/api/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                React Frontend (port 5173)                   │
│              Vite Dev Server + Tailwind CSS                 │
└─────────────────────────────────────────────────────────────┘
                              │
                      CORS Enabled (Origin: localhost:5173)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│       Express API (port 3000)                               │
│   Rate Limiter → CORS → Auth → Entitlement                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              EntitlementService (Feature Gating)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL (Docker)                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Features
- **Independent Projects**: Backend and frontend run as separate services
- **CORS Configuration**: Proper cross-origin setup for development
- **JWT Authentication**: Stateless authentication with Bearer tokens
- **Tenant Isolation**: Complete data separation per tenant
- **Feature Entitlements**: Dynamic feature gating based on subscription plans

## 🔒 Security

- JWT-based authentication with configurable expiration
- Password hashing with bcrypt (10 rounds)
- Tenant isolation at database layer (all queries include tenant_id)
- Rate limiting per tenant (configurable limits)
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- CORS protection with origin whitelisting
- Request timeout protection (10 second default)

## 📄 License

ISC

---

**Built with Node.js, TypeScript, Express, React, and PostgreSQL**
