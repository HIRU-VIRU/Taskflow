# 🛠️ TaskFlow - Development Setup Guide

This guide will help you set up TaskFlow locally for development purposes.

## 📋 Prerequisites

- **Node.js** 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **Docker** (for PostgreSQL database)
- **Git** (for version control)
- **npm** or **pnpm** (package manager)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/HIRU-VIRU/Taskflow.git
cd Taskflow
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# OR use root scripts
npm run install:all
```

### 3. Database Setup

#### Start PostgreSQL with Docker
```bash
# Start PostgreSQL container
npm run db:start

# This runs:
docker run --name taskflow-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=taskflow \
  -p 5432:5432 -d postgres:16-alpine
```

#### Setup Database Schema
```bash
# Run migrations and seed data
npm run db:setup

# OR run from backend directory:
cd backend
npm run migrate
npm run seed
```

### 4. Environment Configuration

#### Backend Environment
```bash
# Copy example file
cp backend/.env.example backend/.env
```

**backend/.env:**
```env
NODE_ENV=development
PORT=3000

# Database (matches Docker setup)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=taskflow

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# Optional: Email Configuration (for testing invitations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=TaskFlow
SMTP_FROM_EMAIL=your-email@gmail.com
```

#### Frontend Environment
```bash
# Copy example file
cp frontend/.env.example frontend/.env
```

**frontend/.env:**
```env
# API URL (points to local backend)
VITE_API_BASE_URL=http://localhost:3000/api
```

### 5. Start Development Servers

#### Option A: Using Root Scripts
```bash
# Terminal 1 - Backend (port 3000)
npm run dev

# Terminal 2 - Frontend (port 5173)
npm run frontend:dev
```

#### Option B: Starting from Directories
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **API Health**: http://localhost:3000/api/health

## 🗄️ Database Management

### Container Management
```bash
# Check container status
docker ps -a | grep taskflow-db

# Start existing container
docker start taskflow-db

# Stop container (keeps data)
docker stop taskflow-db

# Remove container (loses all data)
docker rm taskflow-db

# View container logs
docker logs taskflow-db --tail 20

# Connect to database shell
docker exec -it taskflow-db psql -U postgres -d taskflow
```

### Schema Management
```bash
# Run from backend/ directory
npm run migrate            # Run pending migrations
npm run migrate:rollback   # Rollback last migration
npm run seed              # Run seed files

# OR from project root
npm run db:setup          # Run migrations + seeds
```

### Reset Database Completely
```bash
docker stop taskflow-db
docker rm taskflow-db
npm run db:start
npm run db:setup
```

## 🔧 Development Commands

### Backend (from `backend/` directory)
```bash
npm run dev              # Start with hot reload (ts-node-dev)
npm run debug            # Start with debug mode
npm run build            # Build TypeScript to JavaScript
npm run start            # Start production server (requires build)
```

### Frontend (from `frontend/` directory)
```bash
npm run dev              # Start Vite dev server with HMR
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code with ESLint
```

### Root Management Scripts
```bash
npm run backend:install  # Install backend dependencies
npm run backend:dev      # Start backend development server
npm run backend:build    # Build backend for production

npm run frontend:install # Install frontend dependencies
npm run frontend:dev     # Start frontend development server
npm run frontend:build   # Build frontend for production

npm run install:all      # Install both backend + frontend
npm run build:all        # Build both projects
```

## 🧪 Testing the API

### Create a Test Tenant
```bash
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
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "tenantSlug": "test-corp"
  }'
```

## 🏗️ Project Structure

```
Taskflow/
├── docs/                    # Documentation
├── scripts/                 # Deployment & utility scripts
├── backend/                 # Node.js API server
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Express middleware
│   ├── services/           # Business logic
│   ├── repositories/       # Database access
│   ├── routes/             # API routes
│   ├── database/           # Migrations & seeds
│   └── types/              # TypeScript definitions
├── frontend/               # React application
│   ├── src/
│   │   ├── api/            # API client & services
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utilities
│   └── public/             # Static assets
├── package.json            # Root management scripts
└── README.md               # Main documentation
```

## 🐛 Common Issues & Solutions

### Database Connection Issues
```bash
# Check if Docker is running
docker ps

# Check if PostgreSQL container is running
docker ps | grep taskflow-db

# If container stopped, restart it
docker start taskflow-db

# Wait a few seconds for database to be ready
sleep 5
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use different port in backend/.env
PORT=3001
```

### Permission Errors
```bash
# Fix npm permission issues
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Or use npm with --unsafe-perm flag
npm install --unsafe-perm
```

### Module Not Found Errors
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🔄 Development Workflow

1. **Start Database**: `npm run db:start`
2. **Run Migrations**: `npm run db:setup`
3. **Start Backend**: `npm run dev`
4. **Start Frontend**: `npm run frontend:dev`
5. **Make Changes**: Edit code with hot reload
6. **Test Changes**: Use browser + API testing
7. **Commit Changes**: Standard git workflow

## 📚 Additional Resources

- **Architecture**: Multi-tenant SaaS with PostgreSQL
- **Authentication**: JWT-based stateless auth
- **Frontend**: React 18 + TypeScript + Tailwind
- **Backend**: Express + TypeScript + Knex.js
- **Database**: PostgreSQL with Knex migrations

Happy coding! 🎉