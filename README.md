# TaskFlow - Multi-Tenant Project Management SaaS

A production-ready multi-tenant Project Management SaaS application built as a **monorepo** with a Node.js/Express/TypeScript backend and React/TypeScript frontend. Features subscription-based access control with feature entitlements and usage limits.

## 🎯 Features

- **Multi-Tenancy**: Complete tenant isolation with shared database architecture
- **Subscription Management**: Database-driven plans (Free, Pro, Enterprise)
- **Feature Entitlement**: Fine-grained feature access control
- **Usage Limiting**: Enforce limits on projects, users, and resources
- **JWT Authentication**: Stateless authentication for horizontal scalability
- **Rate Limiting**: Per-tenant request throttling
- **Clean Architecture**: Controller → Service → Repository pattern
- **Modern Frontend**: React 18 with TypeScript, Tailwind CSS, and React Router

## 📁 Monorepo Structure

```
Taskflow/
├── src/                    # Backend source code
│   ├── config/             # Database & env configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   ├── repositories/       # Database access layer
│   ├── routes/             # API routes
│   ├── database/           # Migrations & seeds
│   └── types/              # TypeScript types
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── api/            # API client & services
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Tenant, Notifications)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── documents/              # Documentation
├── package.json            # Root package.json with monorepo scripts
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### 1. Clone and Install Everything

```bash
git clone <repository-url>
cd Taskflow

# Install all dependencies (backend + frontend)
npm run install:all
```

### 2. Environment Setup

```bash
# Backend environment
cp .env.example .env

# Frontend environment
cp frontend/.env.example frontend/.env
```

Edit `.env` with your backend configuration:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=taskflow

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### 3. Database Setup

```bash
# Create database
createdb taskflow

# Run migrations
npm run migrate

# Seed initial data (plans, features)
npm run seed
```

### 4. Start Development (Both Frontend & Backend)

```bash
# Run both backend and frontend concurrently
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1 - Backend (port 3000)
npm run dev

# Terminal 2 - Frontend (port 5173)
npm run frontend:dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

## 🛠️ Available Scripts

### Root Commands (Monorepo)

```bash
npm run install:all      # Install backend + frontend dependencies
npm run dev:all          # Run backend + frontend concurrently
npm run build:all        # Build backend + frontend for production
npm run dev              # Run backend only
npm run build            # Build backend only
npm run migrate          # Run database migrations
npm run seed             # Seed initial data
```

### Frontend Commands

```bash
npm run frontend:install  # Install frontend dependencies
npm run frontend:dev      # Run frontend dev server
npm run frontend:build    # Build frontend for production
npm run frontend:preview  # Preview production build
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Frontend)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         API Layer (Rate Limiter → Auth → Entitlement)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              EntitlementService (CRITICAL)                   │
│         check(tenantId, feature, usageKey)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                      │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Taskflow
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=taskflow

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### 3. Database Setup

```bash
# Create database
createdb taskflow

# Run migrations
npm run migrate

# Seed initial data (plans, features)
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

## 📊 Database Schema

### Core Entities

- **tenants**: Organizations using the system
- **users**: Users within tenants
- **plans**: Subscription plans (Free, Pro, Enterprise)
- **features**: Available features (CREATE_PROJECT, INVITE_USER, etc.)
- **subscriptions**: Tenant subscription assignments
- **projects**: Tenant projects
- **tasks**: Tasks within projects
- **usage_tracking**: Current usage metrics per tenant

### Default Plans

| Plan | Price | Features | Limits |
|------|-------|----------|--------|
| Free | $0 | CREATE_PROJECT, CREATE_TASK | 3 projects, 5 users |
| Pro | $29.99 | All features | 20 projects, 50 users |
| Enterprise | $99.99 | All features | Unlimited |

## 🔐 API Endpoints

### Authentication

#### Register Tenant
```http
POST /api/auth/register
Content-Type: application/json

{
  "tenantName": "Acme Corp",
  "tenantSlug": "acme-corp",
  "adminEmail": "admin@acme.com",
  "adminPassword": "securePassword123",
  "adminName": "John Admin"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "securePassword123",
  "tenantSlug": "acme-corp"
}
```

### Projects

#### Create Project (requires CREATE_PROJECT feature)
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Redesign company website"
}
```

#### List Projects
```http
GET /api/projects
Authorization: Bearer <token>
```

### Tasks

#### Create Task (requires CREATE_TASK feature)
```http
POST /api/projects/:projectId/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Design homepage mockup",
  "description": "Create initial mockup",
  "priority": "high",
  "assigneeId": "user-uuid",
  "dueDate": "2026-04-01"
}
```

### Users

#### Invite User (requires INVITE_USER feature, admin only)
```http
POST /api/users/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@acme.com",
  "name": "New User",
  "role": "member"
}
```

### Subscriptions

#### Get Current Subscription
```http
GET /api/subscriptions/current
Authorization: Bearer <token>
```

#### Change Plan (admin only)
```http
POST /api/subscriptions/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "uuid-of-pro-plan"
}
```

#### List Available Plans (public)
```http
GET /api/plans
```

### Analytics

#### Get Dashboard (requires VIEW_ANALYTICS feature)
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

## 🔑 Key Design Principles

### 1. Tenant Isolation
> **All queries MUST include tenant_id filter to prevent cross-tenant data access.**

All repository methods enforce tenant isolation at the database layer.

### 2. Centralized Entitlement
```typescript
// EntitlementService.check(tenantId, feature, usageKey)
// Single point of enforcement for all subscription logic

const result = await entitlementService.check(
  tenantId,
  'CREATE_PROJECT',
  'project_count'
);
```

### 3. Entitlement Caching
> **Cache subscription + plan features per tenant (5-minute TTL)** to minimize database load.

### 4. Stateless Architecture
> **JWT-based authentication enabling horizontal scalability.**

### 5. Rate Limiting
> **Per-tenant rate limiting** to prevent abuse and ensure fair resource usage.

## 🎛️ Middleware Pipeline

```
Request
  ↓
Rate Limiter (per tenant)
  ↓
Auth Middleware (validate JWT)
  ↓
Tenant Context Middleware (extract tenantId)
  ↓
Entitlement Middleware (check feature + limits)
  ↓
Controller
```

## 🧪 Testing the Application

### 1. Register a New Tenant
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Test Corp",
    "tenantSlug": "test-corp",
    "adminEmail": "admin@test.com",
    "adminPassword": "password123",
    "adminName": "Admin User"
  }'
```

### 2. Login and Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "tenantSlug": "test-corp"
  }'
```

### 3. Create a Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Project",
    "description": "Testing project creation"
  }'
```

### 4. Test Usage Limit
Create 3 projects on Free plan, then try a 4th - should fail with:
```json
{
  "success": false,
  "error": {
    "code": "USAGE_LIMIT_EXCEEDED",
    "message": "You have reached the maximum number of projects (3) for your plan..."
  }
}
```

### 5. Test Feature Access
Try inviting a user on Free plan - should fail with:
```json
{
  "success": false,
  "error": {
    "code": "FEATURE_NOT_ALLOWED",
    "message": "Your current plan does not include user invitations..."
  }
}
```

## 📁 Project Structure

```
src/
├── config/
│   ├── database.ts          # Knex database connection
│   └── env.ts                # Environment configuration
├── controllers/              # Request handlers
│   ├── AuthController.ts
│   ├── ProjectController.ts
│   ├── TaskController.ts
│   ├── SubscriptionController.ts
│   ├── UserController.ts
│   ├── TenantController.ts
│   └── AnalyticsController.ts
├── middleware/              # Express middleware
│   ├── authMiddleware.ts
│   ├── tenantContextMiddleware.ts
│   ├── entitlementMiddleware.ts    # CRITICAL
│   ├── rateLimiter.ts
│   └── errorHandler.ts
├── services/                # Business logic
│   ├── EntitlementService.ts       # CRITICAL - central enforcement
│   ├── AuthService.ts
│   ├── ProjectService.ts
│   ├── TaskService.ts
│   ├── UserService.ts
│   ├── SubscriptionService.ts
│   ├── TenantService.ts
│   └── AnalyticsService.ts
├── repositories/            # Database access layer
│   ├── TenantRepository.ts
│   ├── UserRepository.ts
│   ├── PlanRepository.ts
│   ├── SubscriptionRepository.ts
│   ├── ProjectRepository.ts
│   ├── TaskRepository.ts
│   └── UsageTrackingRepository.ts
├── routes/                  # API routes
│   ├── auth.routes.ts
│   ├── project.routes.ts
│   ├── task.routes.ts
│   ├── subscription.routes.ts
│   ├── user.routes.ts
│   ├── tenant.routes.ts
│   ├── analytics.routes.ts
│   └── index.ts
├── database/
│   ├── migrations/          # Database migrations
│   └── seeds/               # Seed data
├── types/
│   └── index.ts             # TypeScript types
└── index.ts                 # Application entry point
```

## 🔒 Security Best Practices

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Tenant isolation at database layer
- ✅ Rate limiting per tenant
- ✅ Input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration ready

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Run in Production
```bash
NODE_ENV=production npm start
```

### Environment Variables for Production
- Use strong `JWT_SECRET`
- Set `NODE_ENV=production`
- Configure database with connection pooling
- Enable HTTPS
- Set up Redis for caching (replace in-memory cache)
- Configure proper rate limits

## 📈 Scalability Considerations

1. **Horizontal Scaling**: Stateless design allows multiple instances behind load balancer
2. **Database Indexing**: All critical queries are indexed
3. **Caching**: EntitlementService includes built-in caching (upgrade to Redis for production)
4. **Connection Pooling**: Knex configured with connection pooling
5. **Read Replicas**: Can add read replicas for read-heavy operations

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run migrate      # Run database migrations
npm run migrate:rollback  # Rollback last migration
npm run seed         # Seed initial data
```

## 📚 Additional Resources

- [Phase 1 Planning Document](./documents/plan.md) - Complete architectural design
- [API Documentation](./documents/document.md) - Additional API documentation

## 🤝 Contributing

This is a demo project showcasing multi-tenant SaaS architecture with subscription management.

## 📄 License

ISC

---

**Built with ❤️ using Node.js, TypeScript, Express, and PostgreSQL**
