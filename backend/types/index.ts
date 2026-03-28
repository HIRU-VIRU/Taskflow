// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

// Tenant
export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
}

export interface CreateTenantDTO {
  name: string;
  slug: string;
}

// User
export interface User extends BaseEntity {
  tenant_id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'member';
}

export interface CreateUserDTO {
  tenant_id: string;
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'member';
}

export interface UserResponse {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: string;
  created_at: Date;
}

// Plan
export interface Plan extends BaseEntity {
  name: string;
  description: string | null;
  price_monthly: number;
  is_active: boolean;
}

// Feature
export interface Feature extends BaseEntity {
  code: string;
  name: string;
  description: string | null;
}

export type FeatureCode = 'CREATE_PROJECT' | 'INVITE_USER' | 'CREATE_TASK' | 'VIEW_ANALYTICS';

// PlanFeatureMapping
export interface PlanFeatureMapping {
  id: string;
  plan_id: string;
  feature_id: string;
  created_at: Date;
}

// PlanLimit
export interface PlanLimit {
  id: string;
  plan_id: string;
  limit_key: string;
  limit_value: number;
  created_at: Date;
}

export type LimitKey = 'max_projects' | 'max_users';

// Subscription
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Subscription extends BaseEntity {
  tenant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: Date;
  expires_at: Date | null;
}

export interface SubscriptionWithPlan extends Subscription {
  plan_name: string;
  features: string[];
  limits: Record<string, number>;
}

// Project
export type ProjectStatus = 'active' | 'archived';

export interface Project extends BaseEntity {
  tenant_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_by: string;
  leader_id?: string | null;
  team_id?: string | null;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  leader_id?: string;
  team_id?: string;
}

// Team
export type TeamMemberRole = 'leader' | 'member';

export interface Team extends BaseEntity {
  tenant_id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  created_by: string;
}

export interface CreateTeamDTO {
  name: string;
  description?: string;
  leader_id?: string;
}

export interface TeamMember extends BaseEntity {
  team_id: string;
  user_id: string;
  role: TeamMemberRole;
  joined_at: Date;
}

export interface AddTeamMemberDTO {
  user_id: string;
  role?: TeamMemberRole;
}

// Task
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task extends BaseEntity {
  project_id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  assigned_to_name?: string | null;
  created_by: string;
  due_date: Date | null;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date?: string;
  status?: TaskStatus;
}

// UsageTracking
export interface UsageTracking {
  id: string;
  tenant_id: string;
  usage_key: string;
  current_value: number;
  updated_at: Date;
}

// Entitlement
export interface EntitlementResult {
  allowed: boolean;
  code?: string;
  reason?: string;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Auth
export interface RegisterDTO {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  tenantSlug: string;
}

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

// Request extensions
export interface TenantContext {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId: string;
}

// ─── Platform Admin ──────────────────────────────────────────────────────────

export interface PlatformAdmin {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

// ─── Billing & Usage History ─────────────────────────────────────────────────

export type BillingEventType =
  | 'payment'
  | 'upgrade'
  | 'downgrade'
  | 'cancellation'
  | 'renewal'
  | 'refund'
  | 'trial_start';

export interface BillingEvent {
  id: string;
  tenant_id: string;
  subscription_id: string | null;
  plan_id: string | null;
  event_type: BillingEventType;
  amount: number;
  description: string | null;
  period_start: Date | null;
  period_end: Date | null;
  created_at: Date;
  // joined fields
  plan_name?: string;
}

export interface UsageSnapshot {
  id: string;
  tenant_id: string;
  usage_key: string;
  value: number;
  snapshot_date: string; // ISO date string YYYY-MM-DD
  created_at: Date;
}

// ─── Platform Stats ─────────────────────────────────────────────────────────

export interface PlatformStats {
  totalTenants: number;
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  subscriptionBreakdown: Record<string, number>; // { Free: 3, Pro: 5, Enterprise: 2 }
  estimatedMRR: number;
  newTenantsThisMonth: number;
  revenueSummary: {
    this_month: number;
    last_month: number;
    total_revenue: number;
  };
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  planPrice: number;
  status: string;
  userCount: number;
  projectCount: number;
  createdAt: Date;
}

export interface RevenueDataPoint {
  month: string; // YYYY-MM
  revenue: number;
  tenantCount: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
