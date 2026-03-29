# TaskFlow - Multi-Tenant Project Management SaaS

A production-ready multi-tenant Project Management SaaS application with independent backend and frontend projects. Features subscription-based access control with feature entitlements and usage limits.

## 🎯 Features

- **Multi-Tenancy**: Complete tenant isolation with shared database architecture
- **Subscription Management**: Database-driven plans (Free, Pro, Enterprise)
- **Feature Entitlement**: Fine-grained feature access control
- **Usage Limiting**: Enforce limits on projects, users, and resources
- **JWT Authentication**: Stateless authentication for horizontal scalability
- **Rate Limiting**: Per-tenant request throttling
- **Clean Architecture**: Controller → Service → Repository pattern
- **Modern Frontend**: React 18 with TypeScript, Tailwind CSS, and React Router
- **CORS Enabled**: Cross-origin requests supported for frontend-backend communication

## 📁 Project Structure

```
Taskflow/
├── backend/                # Backend Node.js/Express API
│   ├── node_modules/       # Backend dependencies (separate)
│   ├── package.json        # Backend package configuration
│   ├── tsconfig.json       # Backend TypeScript config
│   ├── config/             # Database & env configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   ├── repositories/       # Database access layer
│   ├── routes/             # API routes
│   ├── database/           # Migrations & seeds
│   └── types/              # TypeScript types
├── frontend/               # React frontend application
│   ├── node_modules/       # Frontend dependencies (separate)
│   ├── package.json        # Frontend package configuration
│   ├── src/
│   │   ├── api/            # API client & services
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Tenant, Notifications)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── scripts/                # Database scripts
│   ├── knexfile.ts         # Database configuration
│   └── migrations & seeds  # Database setup files
├── documents/              # Documentation
├── package.json            # Root package.json (scripts only, no deps)
└── README.md               # This file
```

### 🏗️ Clean Architecture

- **Root folder**: Clean with no `node_modules` - only management scripts
- **Backend**: Independent with its own dependencies in `backend/node_modules/`
- **Frontend**: Independent with its own dependencies in `frontend/node_modules/`
- **Separation**: Each project manages its own dependencies and configurations

## 🔄 Project Structure Changes

This project was restructured from a workspace-based monorepo to independent projects for better dependency isolation:

### Before (Workspace Monorepo)
```
├── node_modules/           # Root dependencies (confusing)
├── package.json            # Workspace config with dependencies
├── backend/                # No package.json
└── frontend/               # Own package.json
```

### After (Clean Independent Structure)
```
├── package.json            # Scripts only, no dependencies
├── backend/
│   ├── package.json        # Backend-specific dependencies
│   └── node_modules/       # Backend dependencies only
└── frontend/
    ├── package.json        # Frontend dependencies
    └── node_modules/       # Frontend dependencies only
```

### Benefits
- ✅ **Clean root**: No dependency pollution in project root
- ✅ **True isolation**: Each project manages its own dependencies
- ✅ **Easier deployment**: Backend and frontend can be deployed independently
- ✅ **Better debugging**: Clear dependency boundaries
- ✅ **Simpler CI/CD**: Build each project separately

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- Git

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/HIRU-VIRU/Taskflow.git
cd Taskflow

# Install backend dependencies
npm run backend:install
# OR: cd backend && npm install

# Install frontend dependencies
npm run frontend:install
# OR: cd frontend && npm install

# Install both with one command
npm run install:all
```

### 2. Database Setup

#### Start PostgreSQL with Docker

```bash
# Start PostgreSQL container (first time)
npm run db:start

# This runs:
# docker run --name taskflow-db \
#   -e POSTGRES_USER=postgres \
#   -e POSTGRES_PASSWORD=postgres \
#   -e POSTGRES_DB=taskflow \
#   -p 5432:5432 -d postgres:16-alpine
```

#### Database Troubleshooting

**If you get "container name already in use" error:**

```bash
# Check if container exists but is stopped
docker ps -a | grep taskflow-db

# Start existing container
docker start taskflow-db

# OR remove and recreate (loses data)
docker rm taskflow-db
npm run db:start
```

**Check database status:**

```bash
# Check if container is running
docker ps | grep taskflow-db

# View database logs
docker logs taskflow-db --tail 10

# Connect to database (optional)
docker exec -it taskflow-db psql -U postgres -d taskflow
```

### 3. Environment Setup

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The default `backend/.env` works with Docker PostgreSQL:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=taskflow

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### 4. Setup Database

```bash
# Run migrations and seed data
npm run db:setup

# Or run from backend directory:
cd backend && npm run migrate && npm run seed
```

### 5. Start Development Servers

**Option A: Using root scripts**

**Terminal 1 - Backend (port 3000):**
```bash
npm run dev
# OR: npm run backend:dev
```

**Terminal 2 - Frontend (port 5173):**
```bash
npm run frontend:dev
```

**Option B: Starting from directories**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **CORS**: Enabled for localhost:5173 → localhost:3000 requests

## 🚀 Production Deployment

### Current Production Setup

| Component | Platform | URL | Configuration |
|-----------|----------|-----|---------------|
| **Frontend** | Vercel | https://your-frontend.vercel.app | Auto-deploy from main branch |
| **Backend API** | AWS EC2 | https://your-api-domain.com/api | nginx + Node.js + PM2 |
| **Database** | AWS RDS | PostgreSQL with SSL | Multi-AZ, encrypted |

### SSL Configuration

- **Frontend**: Automatic HTTPS via Vercel
- **Backend**: Let's Encrypt certificate via nip.io domain
- **API Domain**: `your-ip.nip.io` (resolves to your server IP)
- **Certificate**: Auto-renewal enabled via certbot

### Environment Variables

**Frontend (.env.production):**
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

**Backend (Production):**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@your-db-host:5432/database
JWT_SECRET=your-super-secret-jwt-key
APP_URL=https://your-frontend-domain.com
```

### Deployment Commands

**Frontend (Vercel):**
```bash
cd frontend
vercel --prod --yes
vercel alias <deployment-url> your-frontend-domain.vercel.app
```

**Backend (AWS):**
```bash
./deploy-backend.sh
# OR manually:
scp -i ~/.ssh/your-key.pem <files> ec2-user@your-server-ip:/tmp/
ssh -i ~/.ssh/your-key.pem ec2-user@your-server-ip
cd /home/ec2-user/Taskflow/backend
npm run build
pm2 restart taskflow-api
```

### AWS Infrastructure

- **EC2 Instance**: t3.micro (1 vCPU, 1GB RAM)
- **RDS Database**: PostgreSQL 16, Multi-AZ
- **Security Groups**: Port 443 (HTTPS), 22 (SSH)
- **SSL**: nginx reverse proxy with Let's Encrypt

### Monitoring

```bash
# Check backend status
ssh -i ~/.ssh/your-key.pem ec2-user@your-server-ip
pm2 status taskflow-api
pm2 logs taskflow-api

# Test API health
curl https://your-api-domain.com/api/health
```

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
