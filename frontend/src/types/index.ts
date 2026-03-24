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
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
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
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee_id?: string;
  due_date?: string;
}

// Plan & Subscription Types
export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
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
export type FeatureCode = 'CREATE_PROJECT' | 'INVITE_USER' | 'CREATE_TASK' | 'VIEW_ANALYTICS';

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
