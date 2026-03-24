# TaskFlow - Phase 1 Planning Document
## Multi-Tenant Project Management SaaS with Subscription & Feature Entitlement System

**Tech Stack:** Node.js + Express + PostgreSQL + TypeScript

---

## 1. System Overview

TaskFlow is a multi-tenant Project Management SaaS application similar to Jira/Trello that enables organizations (tenants) to manage projects and tasks collaboratively.

**Key Capabilities:**
- Multiple organizations (tenants) operate in complete isolation
- Each tenant has users who collaborate on projects
- Projects contain tasks with assignments and status tracking
- Subscription-based access control enforces feature entitlements and usage limits
- Database-driven plans allow adding new tiers without code changes

**Multi-Tenancy Approach:** Shared database with tenant_id column on all tenant-scoped tables. All queries filtered by tenant context extracted from authenticated user's JWT token.

**CRITICAL - Tenant Isolation Enforcement:**
> All queries MUST include tenant_id filter to prevent cross-tenant data access. This is enforced at the repository layer to guarantee data isolation.

**Architecture Statement:**
> System follows stateless architecture with JWT-based authentication enabling horizontal scalability.

---

## 2. High-Level Architecture

### Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Frontend)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY / Routes                     │
│              + Rate Limiting per Tenant (abuse prevention)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     MIDDLEWARE LAYER                         │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│  │ Auth         │ │ Tenant       │ │ Entitlement         │  │
│  │ Middleware   │ │ Context      │ │ Middleware          │  │
│  └──────────────┘ └──────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                          │
│  (Request/Response handling, validation, routing logic)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│  (Business logic, orchestration, EntitlementService)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    REPOSITORY LAYER                          │
│  (Database access, queries, transactions)                    │
│  ** All queries include tenant_id filter **                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL DATABASE                      │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow (Step-by-Step)

1. **Request arrives** at API endpoint
2. **Rate Limiter** checks tenant request quota (prevents abuse)
3. **Auth Middleware** validates JWT, extracts userId
4. **Tenant Context Middleware** loads user's tenantId, attaches to request
5. **Entitlement Middleware** (on protected routes):
   - Checks subscription status (ACTIVE/EXPIRED)
   - Validates feature access for the operation
   - Validates usage limits if applicable
6. **Controller** receives validated request
7. **Service** executes business logic
8. **Repository** performs database operations (always filtered by tenant_id)
9. **Response** returned to client

### Subscription Enforcement Location
- **Entitlement Middleware**: Central enforcement point for all subscription checks
- **EntitlementService**: Reusable service called by middleware and services
- **Entitlement Caching**: Cache subscription + plan features per tenant (short TTL) to reduce DB hits

---

## 3. Database Design

### Entity: Tenant
```
Table: tenants
├── id              UUID        PRIMARY KEY, DEFAULT uuid_generate_v4()
├── name            VARCHAR(255) NOT NULL
├── slug            VARCHAR(100) NOT NULL UNIQUE
├── created_at      TIMESTAMP   DEFAULT NOW()
└── updated_at      TIMESTAMP   DEFAULT NOW()
```

### Entity: User
```
Table: users
├── id              UUID        PRIMARY KEY, DEFAULT uuid_generate_v4()
├── tenant_id       UUID        NOT NULL, FOREIGN KEY → tenants(id)
├── email           VARCHAR(255) NOT NULL
├── password_hash   VARCHAR(255) NOT NULL
├── name            VARCHAR(255) NOT NULL
├── role            VARCHAR(50)  DEFAULT 'member' (admin/member)
├── created_at      TIMESTAMP   DEFAULT NOW()
└── updated_at      TIMESTAMP   DEFAULT NOW()

UNIQUE CONSTRAINT: (tenant_id, email)
INDEX: tenant_id
```

### Entity: Plan
```
Table: plans
├── id              UUID        PRIMARY KEY, DEFAULT uuid_generate_v4()
├── name            VARCHAR(100) NOT NULL UNIQUE (e.g., 'Free', 'Pro', 'Enterprise')
├── description     TEXT
├── price_monthly   DECIMAL(10,2) DEFAULT 0
├── is_active       BOOLEAN     DEFAULT true
├── created_at      TIMESTAMP   DEFAULT NOW()
└── updated_at      TIMESTAMP   DEFAULT NOW()
```

### Entity: Feature
```
Table: features
├── id              UUID        PRIMARY KEY, DEFAULT uuid_generate_v4()
├── code            VARCHAR(50) NOT NULL UNIQUE (e.g., 'CREATE_PROJECT', 'INVITE_USER')
├── name            VARCHAR(100) NOT NULL
├── description     TEXT
├── created_at      TIMESTAMP   DEFAULT NOW()
└── updated_at      TIMESTAMP   DEFAULT NOW()

Predefined Features:
- CREATE_PROJECT: Ability to create projects
- INVITE_USER: Ability to invite users to tenant
- CREATE_TASK: Ability to create tasks
- VIEW_ANALYTICS: Access to analytics dashboard
```

### Entity: PlanFeatureMapping
```
Table: plan_feature_mappings
├── id              UUID        PRIMARY KEY, DEFAULT uuid_generate_v4()
├── plan_id         UUID        NOT NULL, FOREIGN KEY → plans(id)
├── feature_id      UUID        NOT NULL, FOREIGN KEY → features(id)
├── created_at      TIMESTAMP   DEFAULT NOW()

UNIQUE CONSTRAINT: (plan_id, feature_id)
INDEX: plan_id
```

### Entity: PlanLimit
```
Table: plan_limits
├── id              UUID        PRIMARY KEY, DEFAULT uuid_generate_v4()
├── plan_id         UUID        NOT NULL, FOREIGN KEY → plans(id)
├── limit_key       VARCHAR(50) NOT NULL (e.g., 'max_projects', 'max_users')
├── limit_value     INTEGER     NOT NULL
├── created_at      TIMESTAMP   DEFAULT NOW()

UNIQUE CONSTRAINT: (plan_id, limit_key)
INDEX: plan_id
```

### Entity: Subscription
```
Table: subscriptions
├── id              UUID        PRIMARY KEY, DEFAULT uuid_generate_v4()
├── tenant_id       UUID        NOT NULL, FOREIGN KEY → tenants(id)
├── plan_id         UUID        NOT NULL, FOREIGN KEY → plans(id)
├── status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' (ACTIVE/EXPIRED/CANCELLED)
├── started_at      TIMESTAMP   NOT NULL DEFAULT NOW()
├── expires_at      TIMESTAMP   NULL (NULL = never expires)
├── created_at      TIMESTAMP   DEFAULT NOW()
└── updated_at      TIMESTAMP   DEFAULT NOW()

INDEX: tenant_id
INDEX: (tenant_id, status) -- For quick active subscription lookup
```

### Entity: Project
```
Table: projects
├── id              UUID        PRIMARY KEY, DEFAULT uuid_generate_v4()
├── tenant_id       UUID        NOT NULL, FOREIGN KEY → tenants(id)
├── name            VARCHAR(255) NOT NULL
├── description     TEXT
├── status          VARCHAR(20) DEFAULT 'active' (active/archived)
├── created_by      UUID        FOREIGN KEY → users(id)
├── created_at      TIMESTAMP   DEFAULT NOW()
└── updated_at      TIMESTAMP   DEFAULT NOW()

INDEX: tenant_id
INDEX: (tenant_id, status)
```

### Entity: Task (Optional but Recommended)
```
Table: tasks
├── id              UUID        PRIMARY KEY, DEFAULT uuid_generate_v4()
├── project_id      UUID        NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE
├── tenant_id       UUID        NOT NULL, FOREIGN KEY → tenants(id)
├── title           VARCHAR(255) NOT NULL
├── description     TEXT
├── status          VARCHAR(20) DEFAULT 'todo' (todo/in_progress/done)
├── priority        VARCHAR(20) DEFAULT 'medium' (low/medium/high)
├── assignee_id     UUID        FOREIGN KEY → users(id)
├── created_by      UUID        FOREIGN KEY → users(id)
├── due_date        DATE
├── created_at      TIMESTAMP   DEFAULT NOW()
└── updated_at      TIMESTAMP   DEFAULT NOW()

INDEX: project_id
INDEX: tenant_id
INDEX: assignee_id
```

### Entity: UsageTracking
```
Table: usage_tracking
├── id              UUID        PRIMARY KEY, DEFAULT uuid_generate_v4()
├── tenant_id       UUID        NOT NULL, FOREIGN KEY → tenants(id)
├── usage_key       VARCHAR(50) NOT NULL (e.g., 'project_count', 'user_count')
├── current_value   INTEGER     NOT NULL DEFAULT 0
├── updated_at      TIMESTAMP   DEFAULT NOW()

UNIQUE CONSTRAINT: (tenant_id, usage_key)
INDEX: tenant_id
```

---

## 4. Entity Relationships

### Relationship Diagram

```
┌─────────────┐       1:N        ┌─────────────┐
│   Tenant    │─────────────────▶│    User     │
└─────────────┘                  └─────────────┘
      │
      │ 1:N
      ▼
┌─────────────┐       N:1        ┌─────────────┐
│Subscription │─────────────────▶│    Plan     │
└─────────────┘                  └─────────────┘
      │                                │
      │                                │ 1:N
      │                                ▼
      │                     ┌────────────────────┐
      │                     │ PlanFeatureMapping │
      │                     └────────────────────┘
      │                                │
      │                                │ N:1
      │                                ▼
      │                          ┌─────────────┐
      │                          │   Feature   │
      │                          └─────────────┘
      │
      │        ┌─────────────┐
      │ 1:N    │  Plan       │ 1:N    ┌─────────────┐
      └───────▶│  Limits     │───────▶│  PlanLimit  │
               └─────────────┘        └─────────────┘

┌─────────────┐       1:N        ┌─────────────┐
│   Tenant    │─────────────────▶│   Project   │
└─────────────┘                  └─────────────┘
                                       │
                                       │ 1:N
                                       ▼
                                 ┌─────────────┐
                                 │    Task     │
                                 └─────────────┘

┌─────────────┐       1:N        ┌───────────────┐
│   Tenant    │─────────────────▶│ UsageTracking │
└─────────────┘                  └───────────────┘
```

### Relationship Summary

| From Entity | To Entity | Type | Description |
|-------------|-----------|------|-------------|
| Tenant | User | 1:N | A tenant has many users |
| Tenant | Subscription | 1:N | A tenant has subscription history (one ACTIVE at a time) |
| Tenant | Project | 1:N | A tenant has many projects |
| Tenant | UsageTracking | 1:N | A tenant has usage metrics |
| Subscription | Plan | N:1 | Many subscriptions reference same plan |
| Plan | PlanFeatureMapping | 1:N | A plan enables many features |
| PlanFeatureMapping | Feature | N:1 | Many mappings reference same feature |
| Plan | PlanLimit | 1:N | A plan has many limits |
| Project | Task | 1:N | A project has many tasks |
| User | Task | 1:N | A user can be assigned many tasks |

---

## 5. API Design

### Authentication APIs

#### POST /api/auth/register
**Purpose:** Register a new tenant with admin user
**Request Body:**
```json
{
  "tenantName": "Acme Corp",
  "tenantSlug": "acme-corp",
  "adminEmail": "admin@acme.com",
  "adminPassword": "securePassword123",
  "adminName": "John Admin"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "tenant": { "id": "uuid", "name": "Acme Corp", "slug": "acme-corp" },
    "user": { "id": "uuid", "email": "admin@acme.com", "name": "John Admin", "role": "admin" },
    "subscription": { "id": "uuid", "planName": "Free", "status": "ACTIVE" }
  }
}
```

#### POST /api/auth/login
**Purpose:** Authenticate user and return JWT
**Request Body:**
```json
{
  "email": "admin@acme.com",
  "password": "securePassword123",
  "tenantSlug": "acme-corp"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "user": { "id": "uuid", "email": "admin@acme.com", "name": "John Admin", "role": "admin" },
    "tenant": { "id": "uuid", "name": "Acme Corp" }
  }
}
```

### Tenant APIs

#### GET /api/tenants/current
**Purpose:** Get current tenant details
**Headers:** `Authorization: Bearer <token>`
**Response (200):**
```json
{
  "success": true,
  "data": {
    "tenant": { "id": "uuid", "name": "Acme Corp", "slug": "acme-corp" },
    "subscription": { "planName": "Free", "status": "ACTIVE", "expiresAt": null },
    "usage": { "project_count": 2, "user_count": 3 }
  }
}
```

### User APIs

#### POST /api/users/invite
**Purpose:** Invite a new user to tenant (requires INVITE_USER feature)
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "email": "newuser@acme.com",
  "name": "New User",
  "role": "member"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "newuser@acme.com", "name": "New User", "role": "member" }
  }
}
```
**Error (403 - Feature not allowed):**
```json
{
  "success": false,
  "error": {
    "code": "FEATURE_NOT_ALLOWED",
    "message": "Your current plan does not include user invitations. Please upgrade to Pro."
  }
}
```

#### GET /api/users
**Purpose:** List all users in tenant
**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      { "id": "uuid", "email": "admin@acme.com", "name": "John Admin", "role": "admin" }
    ]
  }
}
```

### Subscription APIs

#### POST /api/subscriptions/assign
**Purpose:** Assign/change subscription plan for tenant (admin only)
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "planId": "uuid-of-pro-plan"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "uuid",
      "planName": "Pro",
      "status": "ACTIVE",
      "startedAt": "2026-03-24T10:00:00Z",
      "expiresAt": "2027-03-24T10:00:00Z"
    }
  }
}
```

#### GET /api/subscriptions/current
**Purpose:** Get current subscription details
**Response (200):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "planName": "Free",
      "status": "ACTIVE",
      "features": ["CREATE_PROJECT", "CREATE_TASK"],
      "limits": { "max_projects": 3 }
    }
  }
}
```

#### GET /api/plans
**Purpose:** List all available plans
**Response (200):**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "uuid",
        "name": "Free",
        "priceMonthly": 0,
        "features": ["CREATE_PROJECT", "CREATE_TASK"],
        "limits": { "max_projects": 3 }
      },
      {
        "id": "uuid",
        "name": "Pro",
        "priceMonthly": 29.99,
        "features": ["CREATE_PROJECT", "CREATE_TASK", "INVITE_USER", "VIEW_ANALYTICS"],
        "limits": { "max_projects": -1 }
      }
    ]
  }
}
```

### Project APIs

#### POST /api/projects
**Purpose:** Create a new project (requires CREATE_PROJECT feature, enforces limit)
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "name": "Website Redesign",
  "description": "Redesign company website"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Redesign company website",
      "status": "active",
      "createdAt": "2026-03-24T10:00:00Z"
    }
  }
}
```
**Error (403 - Usage limit exceeded):**
```json
{
  "success": false,
  "error": {
    "code": "USAGE_LIMIT_EXCEEDED",
    "message": "You have reached the maximum number of projects (3) for your plan. Please upgrade to create more projects."
  }
}
```

#### GET /api/projects
**Purpose:** List all projects for tenant
**Response (200):**
```json
{
  "success": true,
  "data": {
    "projects": [
      { "id": "uuid", "name": "Website Redesign", "status": "active", "taskCount": 5 }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  }
}
```

#### GET /api/projects/:projectId
**Purpose:** Get project details
**Response (200):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Redesign company website",
      "status": "active",
      "createdBy": { "id": "uuid", "name": "John Admin" },
      "createdAt": "2026-03-24T10:00:00Z"
    }
  }
}
```

### Task APIs

#### POST /api/projects/:projectId/tasks
**Purpose:** Create a task in a project (requires CREATE_TASK feature)
**Request Body:**
```json
{
  "title": "Design homepage mockup",
  "description": "Create initial mockup for homepage",
  "priority": "high",
  "assigneeId": "uuid-of-user",
  "dueDate": "2026-04-01"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid",
      "title": "Design homepage mockup",
      "status": "todo",
      "priority": "high"
    }
  }
}
```

#### GET /api/projects/:projectId/tasks
**Purpose:** List tasks in a project
**Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      { "id": "uuid", "title": "Design homepage mockup", "status": "todo", "priority": "high" }
    ]
  }
}
```

### Analytics API

#### GET /api/analytics/dashboard
**Purpose:** Get analytics data (requires VIEW_ANALYTICS feature)
**Response (200):**
```json
{
  "success": true,
  "data": {
    "projectCount": 5,
    "tasksByStatus": { "todo": 10, "in_progress": 5, "done": 20 },
    "userCount": 8
  }
}
```

---

## 6. Subscription Enforcement Logic (CRITICAL)

### Feature Check Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Feature Check Logic                       │
├─────────────────────────────────────────────────────────────┤
│ 1. Get tenant's ACTIVE subscription                          │
│ 2. Get plan from subscription                                │
│ 3. Query plan_feature_mappings for (plan_id, feature_code)   │
│ 4. If mapping exists → ALLOW                                 │
│ 5. If no mapping → DENY with 403 FEATURE_NOT_ALLOWED         │
└─────────────────────────────────────────────────────────────┘
```

**SQL Query:**
```sql
SELECT COUNT(*) > 0 AS has_feature
FROM subscriptions s
JOIN plan_feature_mappings pfm ON s.plan_id = pfm.plan_id
JOIN features f ON pfm.feature_id = f.id
WHERE s.tenant_id = $1
  AND s.status = 'ACTIVE'
  AND f.code = $2;
```

### Usage Limit Check Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Usage Limit Check Logic                    │
├─────────────────────────────────────────────────────────────┤
│ 1. Get tenant's ACTIVE subscription                          │
│ 2. Get plan_limits for (plan_id, limit_key)                  │
│ 3. Get current usage from usage_tracking (tenant_id, key)    │
│ 4. If limit_value == -1 → UNLIMITED, ALLOW                   │
│ 5. If current_value < limit_value → ALLOW                    │
│ 6. If current_value >= limit_value → DENY with 403           │
└─────────────────────────────────────────────────────────────┘
```

### Subscription Status Check Flow

```
┌─────────────────────────────────────────────────────────────┐
│                Subscription Status Check Logic               │
├─────────────────────────────────────────────────────────────┤
│ 1. Query subscription WHERE tenant_id = ? AND status = ?     │
│ 2. Check expires_at:                                         │
│    - If NULL → never expires, OK                            │
│    - If expires_at < NOW() → Mark as EXPIRED, DENY          │
│ 3. If status != 'ACTIVE' → DENY with 403 SUBSCRIPTION_EXPIRED│
│ 4. If ACTIVE and not expired → ALLOW                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Middleware / Interceptor Design (MOST IMPORTANT)

### EntitlementService API

```typescript
class EntitlementService {
  /**
   * Central entitlement check method
   * @param tenantId - The tenant performing the action
   * @param feature - Feature code to check (e.g., 'CREATE_PROJECT')
   * @param usageKey - Optional usage limit key (e.g., 'project_count')
   * @returns { allowed: boolean, reason?: string, code?: string }
   */
  async check(
    tenantId: string,
    feature: string,
    usageKey?: string
  ): Promise<EntitlementResult>
}
```

### Entitlement Caching Strategy

> **Cache subscription + plan features per tenant (short TTL)** to reduce database load on every request.

```typescript
// Cache keys:
// - `entitlement:${tenantId}:subscription` → TTL: 5 minutes
// - `entitlement:${tenantId}:features` → TTL: 5 minutes
// - `plan:${planId}:features` → TTL: 1 hour (plans change rarely)

// Invalidate cache on:
// - Subscription change
// - Plan upgrade/downgrade
```

### Entitlement Middleware

```typescript
// Middleware factory function
const requireEntitlement = (feature: string, usageKey?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.tenantContext.tenantId;

    const result = await entitlementService.check(tenantId, feature, usageKey);

    if (!result.allowed) {
      return res.status(403).json({
        success: false,
        error: {
          code: result.code,
          message: result.reason
        }
      });
    }

    next();
  };
};

// Usage on routes:
router.post('/projects',
  authMiddleware,
  tenantContextMiddleware,
  requireEntitlement('CREATE_PROJECT', 'project_count'),
  projectController.create
);
```

### Middleware Execution Order

```
Request → rateLimiter → authMiddleware → tenantContextMiddleware → requireEntitlement → Controller

1. rateLimiter:
   - Rate limiting per tenant (to prevent abuse)
   - Returns 429 if quota exceeded

2. authMiddleware:
   - Validates JWT token
   - Extracts userId, attaches to req.user
   - Returns 401 if invalid

3. tenantContextMiddleware:
   - Loads user's tenant from DB
   - Attaches tenantId to req.tenantContext
   - Returns 403 if no tenant found

4. requireEntitlement(feature, usageKey):
   - Calls EntitlementService.check()
   - Step 1: Check subscription status (ACTIVE/EXPIRED)
   - Step 2: Check feature entitlement
   - Step 3: Check usage limit if usageKey provided
   - Returns 403 with appropriate error code if denied
   - Calls next() if allowed
```

### Validation Flow Inside EntitlementService.check()

```
┌─────────────────────────────────────────────────────────────┐
│              EntitlementService.check() Flow                 │
├─────────────────────────────────────────────────────────────┤
│ INPUT: tenantId, feature, usageKey?                          │
│                                                              │
│ STEP 1: Get Active Subscription (from cache or DB)           │
│   - Query: SELECT * FROM subscriptions                       │
│            WHERE tenant_id = ? AND status = 'ACTIVE'         │
│   - If none found → DENY (SUBSCRIPTION_NOT_FOUND)            │
│   - If expires_at < NOW() → Update to EXPIRED, DENY          │
│                                                              │
│ STEP 2: Check Feature Access (from cache or DB)              │
│   - Query plan_feature_mappings + features                   │
│   - If feature not mapped to plan → DENY (FEATURE_NOT_ALLOWED)│
│                                                              │
│ STEP 3: Check Usage Limit (if usageKey provided)             │
│   - Get limit from plan_limits                               │
│   - Get current usage from usage_tracking                    │
│   - If limit == -1 → UNLIMITED, ALLOW                        │
│   - If current >= limit → DENY (USAGE_LIMIT_EXCEEDED)        │
│                                                              │
│ OUTPUT: { allowed: true } or { allowed: false, code, reason }│
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Usage Limiting Strategy

### What is Tracked

| Usage Key | Description | Trigger |
|-----------|-------------|---------|
| project_count | Number of active projects | +1 on create, -1 on delete |
| user_count | Number of active users | +1 on invite, -1 on remove |

### Where Stored

- **Table:** `usage_tracking`
- **Columns:** `tenant_id`, `usage_key`, `current_value`
- **Unique Constraint:** (tenant_id, usage_key)

### How Updated Safely

**Using Database Transactions with Row Locking:**

```typescript
async incrementUsage(tenantId: string, usageKey: string): Promise<void> {
  await db.transaction(async (trx) => {
    // Lock the row for update to prevent race conditions
    const usage = await trx('usage_tracking')
      .where({ tenant_id: tenantId, usage_key: usageKey })
      .forUpdate()
      .first();

    if (usage) {
      await trx('usage_tracking')
        .where({ tenant_id: tenantId, usage_key: usageKey })
        .increment('current_value', 1);
    } else {
      await trx('usage_tracking').insert({
        tenant_id: tenantId,
        usage_key: usageKey,
        current_value: 1
      });
    }
  });
}
```

**Alternative: Atomic UPDATE with check:**
```sql
UPDATE usage_tracking
SET current_value = current_value + 1, updated_at = NOW()
WHERE tenant_id = $1 AND usage_key = $2
RETURNING current_value;
```

### Usage Update Flow

```
Create Project Request:
1. EntitlementService.check() validates limit NOT exceeded
2. ProjectService creates project in DB
3. UsageService.increment('project_count') atomically increments
4. Both wrapped in single transaction for rollback safety
```

---

## 9. Edge Cases

### 1. Concurrent Project Creation (Race Condition)

**Problem:** Two requests try to create the 3rd project simultaneously when limit is 3.

**Solution:**
- Use database transaction with `SELECT ... FOR UPDATE` to lock usage row
- Check and increment must be atomic within same transaction
- Second request will wait, then see updated value and fail

```typescript
async createProject(tenantId: string, data: ProjectDTO) {
  return await db.transaction(async (trx) => {
    // Lock and check usage
    const usage = await trx('usage_tracking')
      .where({ tenant_id: tenantId, usage_key: 'project_count' })
      .forUpdate()
      .first();

    const limit = await this.getPlanLimit(tenantId, 'max_projects', trx);

    if (limit !== -1 && usage.current_value >= limit) {
      throw new UsageLimitExceededError('project_count');
    }

    // Create project
    const project = await trx('projects').insert({...}).returning('*');

    // Increment usage
    await trx('usage_tracking')
      .where({ tenant_id: tenantId, usage_key: 'project_count' })
      .increment('current_value', 1);

    return project;
  });
}
```

### 2. Subscription Expiry

**Handling:**
- Check `expires_at` in EntitlementService.check()
- If expired, update status to 'EXPIRED' and reject
- Background job (optional) can proactively expire subscriptions
- Expired tenants can still read data but cannot create/modify

```typescript
// In EntitlementService.check()
if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
  await subscriptionRepository.updateStatus(subscription.id, 'EXPIRED');
  return { allowed: false, code: 'SUBSCRIPTION_EXPIRED', reason: 'Your subscription has expired' };
}
```

### 3. Plan Upgrades

**Flow:**
1. Tenant requests upgrade via POST /api/subscriptions/assign
2. Mark current subscription as 'CANCELLED'
3. Create new subscription with new plan
4. New features immediately available
5. Usage limits reset/extended based on new plan
6. **Invalidate entitlement cache for tenant**

**No data loss:** Projects/tasks remain, just more features unlocked.

### 4. Plan Downgrades

**Flow:**
1. Tenant requests downgrade
2. Check if current usage exceeds new plan limits
3. If exceeds → Reject downgrade OR warn user
4. If within limits → Apply downgrade
5. Mark current subscription CANCELLED, create new one
6. **Invalidate entitlement cache for tenant**

**Policy Decision:**
- Option A: Block downgrade if over limit
- Option B: Allow but block new creations until under limit

### 5. Data Consistency

**Ensuring consistency:**
- All business operations use database transactions
- Foreign key constraints prevent orphan records
- ON DELETE CASCADE for project → tasks
- Soft deletes (status='archived') preferred over hard deletes
- Usage tracking updated within same transaction as resource creation

---

## 10. Scalability

### Architecture Statement

> **System follows stateless architecture with JWT-based authentication enabling horizontal scalability.**

### Horizontal Scaling

**Application Layer:**
- Stateless Express servers behind load balancer
- JWT tokens eliminate server-side session state
- Any instance can handle any request

**Database Layer:**
- Read replicas for read-heavy operations (GET endpoints)
- Connection pooling (pg-pool) with appropriate pool sizes
- Consider partitioning large tables by tenant_id for scale

### API Rate Limiting (Abuse Prevention)

> **Rate limiting per tenant to prevent abuse and ensure fair usage.**

```typescript
// Rate limiting middleware using Redis
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // 100 requests per minute per tenant
  keyGenerator: (req) => req.tenantContext?.tenantId || req.ip,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});
```

### Database Indexing Strategy

```sql
-- Primary lookup patterns
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

-- Subscription lookups (critical path)
CREATE INDEX idx_subscriptions_tenant_status ON subscriptions(tenant_id, status);
CREATE INDEX idx_plan_feature_mappings_plan_id ON plan_feature_mappings(plan_id);
CREATE INDEX idx_plan_limits_plan_id ON plan_limits(plan_id);

-- Usage tracking (frequently accessed)
CREATE INDEX idx_usage_tracking_tenant_key ON usage_tracking(tenant_id, usage_key);

-- Composite for unique email per tenant
CREATE UNIQUE INDEX idx_users_tenant_email ON users(tenant_id, email);
```

### Caching Strategy

> **Cache subscription + plan features per tenant (short TTL)**

**What to Cache:**
- Plan features mapping (changes rarely) - TTL: 1 hour
- Plan limits (changes rarely) - TTL: 1 hour
- Active subscription details (cache per tenant) - TTL: 5 minutes

**Implementation:**
- Redis for distributed cache
- Cache invalidation on plan/subscription changes

```typescript
// Example caching in EntitlementService
async getPlanFeatures(planId: string): Promise<string[]> {
  const cacheKey = `plan:${planId}:features`;
  let features = await redis.get(cacheKey);

  if (!features) {
    features = await this.planRepository.getFeatures(planId);
    await redis.setex(cacheKey, 3600, JSON.stringify(features));
  }

  return features;
}
```

---

## 11. Request Flow Example: Create Project

### Scenario
User on "Free" plan (max 3 projects) attempts to create their 3rd project.

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Request Arrives                                      │
├─────────────────────────────────────────────────────────────┤
│ POST /api/projects                                           │
│ Headers: Authorization: Bearer <jwt_token>                   │
│ Body: { "name": "New Project", "description": "..." }        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1.5: Rate Limiter                                       │
├─────────────────────────────────────────────────────────────┤
│ - Check tenant request quota                                 │
│ - If exceeded → 429 Too Many Requests                        │
│ - Otherwise → Continue                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Auth Middleware                                      │
├─────────────────────────────────────────────────────────────┤
│ - Decode JWT token                                           │
│ - Verify signature and expiration                            │
│ - Extract userId from payload                                │
│ - Attach req.user = { id: 'user-uuid' }                      │
│ - Call next()                                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Tenant Context Middleware                            │
├─────────────────────────────────────────────────────────────┤
│ - Query: SELECT tenant_id FROM users WHERE id = ?            │
│ - Load tenant details                                        │
│ - Attach req.tenantContext = { tenantId: 'tenant-uuid' }     │
│ - Call next()                                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Entitlement Middleware                               │
│ requireEntitlement('CREATE_PROJECT', 'project_count')        │
├─────────────────────────────────────────────────────────────┤
│ Calls EntitlementService.check(tenantId, 'CREATE_PROJECT',   │
│                                 'project_count')             │
│                                                              │
│ Inside check():                                              │
│ 4a. Get Active Subscription (check cache first)              │
│     - Query subscriptions WHERE tenant_id AND status=ACTIVE  │
│     - Found: { plan_id: 'free-plan-uuid', status: 'ACTIVE' } │
│     - Check expires_at: NULL (never expires) ✓               │
│                                                              │
│ 4b. Check Feature Access (check cache first)                 │
│     - Query: plan_feature_mappings + features                │
│     - Result: CREATE_PROJECT is mapped to Free plan ✓        │
│                                                              │
│ 4c. Check Usage Limit                                        │
│     - Get limit: plan_limits WHERE plan_id AND key='max_proj'│
│     - Result: limit_value = 3                                │
│     - Get usage: usage_tracking WHERE tenant_id AND key      │
│     - Result: current_value = 2                              │
│     - Check: 2 < 3 ✓ ALLOWED                                 │
│                                                              │
│ Return: { allowed: true }                                    │
│ Call next()                                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Controller (ProjectController.create)                │
├─────────────────────────────────────────────────────────────┤
│ - Validate request body                                      │
│ - Extract tenantId from req.tenantContext                    │
│ - Call projectService.create(tenantId, data)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Service (ProjectService.create) + Transaction        │
├─────────────────────────────────────────────────────────────┤
│ BEGIN TRANSACTION                                            │
│                                                              │
│ 6a. Lock usage row                                           │
│     - SELECT * FROM usage_tracking                           │
│       WHERE tenant_id = ? AND usage_key = 'project_count'    │
│       FOR UPDATE                                             │
│                                                              │
│ 6b. Double-check limit (defensive)                           │
│     - If current_value >= limit, throw error                 │
│     - current_value = 2, limit = 3 ✓                         │
│                                                              │
│ 6c. Insert project (with tenant_id filter)                   │
│     - INSERT INTO projects (tenant_id, name, ...)            │
│       RETURNING *                                            │
│                                                              │
│ 6d. Increment usage                                          │
│     - UPDATE usage_tracking SET current_value = 3            │
│       WHERE tenant_id = ? AND usage_key = 'project_count'    │
│                                                              │
│ COMMIT TRANSACTION                                           │
│                                                              │
│ Return: { id: 'project-uuid', name: 'New Project', ... }     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Response                                             │
├─────────────────────────────────────────────────────────────┤
│ HTTP 201 Created                                             │
│ {                                                            │
│   "success": true,                                           │
│   "data": {                                                  │
│     "project": {                                             │
│       "id": "project-uuid",                                  │
│       "name": "New Project",                                 │
│       "status": "active",                                    │
│       "createdAt": "2026-03-24T10:00:00Z"                    │
│     }                                                        │
│   }                                                          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
```

### Failure Scenario: Usage Limit Exceeded

If the user already has 3 projects and tries to create a 4th:

```
Step 4c fails:
- current_value = 3, limit_value = 3
- Check: 3 >= 3 → DENIED

Response:
HTTP 403 Forbidden
{
  "success": false,
  "error": {
    "code": "USAGE_LIMIT_EXCEEDED",
    "message": "You have reached the maximum number of projects (3) for your plan. Please upgrade to create more projects."
  }
}
```

---

## 12. Key Design Highlights (Interview Points)

### Tenant Isolation
> **All queries MUST include tenant_id filter to prevent cross-tenant data access.**

### Stateless Architecture
> **System follows stateless architecture with JWT-based authentication enabling horizontal scalability.**

### Entitlement Caching
> **Cache subscription + plan features per tenant (short TTL)** to minimize database load.

### Rate Limiting
> **Rate limiting per tenant** to prevent abuse and ensure fair resource usage.

### Centralized Entitlement
> **EntitlementService.check(tenantId, feature, usageKey)** - Single point of enforcement for all subscription logic.

---

## Implementation Order (Phase 2)

After approval, implementation will proceed in this order:

1. **Project Setup**
   - Initialize Node.js + TypeScript project
   - Configure PostgreSQL connection
   - Set up project structure (controllers, services, repositories, middleware)

2. **Database Schema**
   - Create migrations for all tables
   - Seed initial plans, features, and plan_feature_mappings

3. **Entities/Models**
   - Define TypeScript interfaces and types
   - Create database models

4. **Repositories**
   - TenantRepository, UserRepository, PlanRepository
   - SubscriptionRepository, ProjectRepository, TaskRepository
   - UsageTrackingRepository

5. **Services**
   - AuthService (register, login, JWT)
   - **EntitlementService** (CRITICAL - central enforcement)
   - UsageService (increment, decrement, get)
   - TenantService, ProjectService, TaskService

6. **Middleware (CRITICAL)**
   - rateLimiter
   - authMiddleware
   - tenantContextMiddleware
   - requireEntitlement middleware factory

7. **Controllers**
   - AuthController
   - TenantController
   - SubscriptionController
   - ProjectController
   - TaskController

8. **API Routes**
   - Wire up all endpoints with appropriate middleware

9. **Testing**
   - Unit tests for EntitlementService
   - Integration tests for API endpoints
   - Edge case tests (concurrent creation, expiry)

---

## Verification Plan

1. **Test tenant registration** creates tenant + admin user + Free subscription
2. **Test create project** succeeds with CREATE_PROJECT feature
3. **Test create 4th project on Free plan** fails with USAGE_LIMIT_EXCEEDED
4. **Test invite user on Free plan** fails with FEATURE_NOT_ALLOWED
5. **Test upgrade to Pro plan** enables INVITE_USER feature
6. **Test expired subscription** blocks all feature access
7. **Test concurrent project creation** handles race condition correctly
8. **Test rate limiting** blocks excessive requests

---

**Do you approve this plan? Should I proceed to implementation?**
