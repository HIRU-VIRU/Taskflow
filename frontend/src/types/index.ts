// User & Authentication Types
export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
  accessToken: string;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

// Project Types
export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  created_by: string;
  leader_id?: string | null;
  team_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  leader_id?: string;
  team_id?: string;
}

// Team Types
export interface Team {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  project_count?: number; // Included in list views
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  leader_id?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'leader' | 'member';
  joined_at: string;
  user_name?: string;
  user_email?: string;
}

export interface AddTeamMemberRequest {
  user_id: string;
  role?: 'leader' | 'member';
}

// Task Types
export interface Task {
  id: string;
  project_id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee_id: string | null;
  assigned_to_name?: string | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee_id?: string | null;
  due_date?: string;
  status?: 'todo' | 'in_progress' | 'done';
}

// Plan & Subscription Types
export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  priceMonthly?: number; // legacy alias for price_monthly
  priceAnnual?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  features?: string[];
  limits?: Record<string, number>;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  plan_name?: string;
  features?: string[];
  limits?: Record<string, number>;
}

// Feature & Entitlement Types
export type FeatureCode = 'CREATE_PROJECT' | 'INVITE_USER' | 'CREATE_TASK' | 'VIEW_ANALYTICS' | 'AI_SUMMARIZER';

export interface EntitlementCheckResult {
  allowed: boolean;
  code?: string;
  message?: string;
  remaining?: number;
  limit?: number;
}

// API Error Response
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// API Success Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Generic Pagination Response
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// User Invite Request
export interface InviteUserRequest {
  email: string;
  name: string;
  role?: 'admin' | 'member';
}

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug: string;
}

// Register Request
export interface RegisterRequest {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  totalUsers: number;
  recentProjects: Project[];
  recentTasks: Task[];
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// ─── Platform Admin ──────────────────────────────────────────────────────────

export interface PlatformAdmin {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformStats {
  totalTenants: number;
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  subscriptionBreakdown: Record<string, number>;
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
  createdAt: string; // ISO Date String
}

export interface RevenueDataPoint {
  month: string; // YYYY-MM
  revenue: number;
  tenantCount: number;
}

export interface BillingEvent {
  id: string;
  tenant_id: string;
  subscription_id: string | null;
  plan_id: string | null;
  event_type: string;
  amount: number;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  plan_name?: string;
}

export interface UsageSnapshot {
  id: string;
  tenant_id: string;
  usage_key: string;
  value: number;
  snapshot_date: string; // YYYY-MM-DD
  created_at: string;
}

