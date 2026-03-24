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
├── backend/                # Backend source code
│   ├── config/             # Database & env configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   ├── repositories/       # Database access layer
│   ├── routes/             # API routes
│   ├── database/           # Migrations & seeds
│   └── types/              # TypeScript types
├── scripts/                # Build & utility scripts
│   ├── knexfile.ts         # Database configuration
│   ├── restart-server.sh   # Server restart utility
│   └── test-*.ts           # Testing utilities
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

- Node.js 18+
- Docker (for PostgreSQL)
- Git

### 1. Clone and Install

```bash
git clone https://github.com/HIRU-VIRU/Taskflow.git
cd Taskflow

# Install all dependencies (backend + frontend)
npm run install:all
```

### 2. Start PostgreSQL with Docker

```bash
# Start PostgreSQL container
npm run db:start

# This runs:
# docker run --name taskflow-db \
#   -e POSTGRES_USER=postgres \
#   -e POSTGRES_PASSWORD=postgres \
#   -e POSTGRES_DB=taskflow \
#   -p 5432:5432 -d postgres:16-alpine
```

### 3. Environment Setup

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

The default `.env` works with Docker PostgreSQL:

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

# Or run separately:
npm run migrate
npm run seed
```

### 5. Start Development Servers

**Terminal 1 - Backend (port 3000):**
```bash
npm run dev
```

**Terminal 2 - Frontend (port 5173):**
```bash
npm run frontend:dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

## 🛠️ Available Scripts

### Backend Commands

```bash
npm run dev              # Start backend dev server
npm run build            # Build TypeScript
npm start                # Start production server
npm run migrate          # Run database migrations
npm run migrate:rollback # Rollback last migration
npm run seed             # Seed initial data
```

### Frontend Commands

```bash
npm run frontend:install  # Install frontend dependencies
npm run frontend:dev      # Run frontend dev server
npm run frontend:build    # Build frontend for production
npm run frontend:preview  # Preview production build
```

### Database Commands (Docker)

```bash
npm run db:start         # Start PostgreSQL container
npm run db:stop          # Stop and remove container
npm run db:setup         # Run migrations + seeds
```

### Monorepo Commands

```bash
npm run install:all      # Install backend + frontend dependencies
npm run build:all        # Build backend + frontend for production
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
# Register a tenant
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
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
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "tenantSlug": "test-corp"
  }'
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (SPA)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│       Express API (Rate Limiter → Auth → Entitlement)        │
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

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Tenant isolation at database layer
- Rate limiting per tenant
- Input validation with Zod
- SQL injection prevention

## 📄 License

ISC

---

**Built with Node.js, TypeScript, Express, React, and PostgreSQL**
