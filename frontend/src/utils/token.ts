// Token storage and retrieval utilities

const TOKEN_KEY = 'taskflow_token';
const TENANT_ID_KEY = 'taskflow_tenant_id';
const USER_ID_KEY = 'taskflow_user_id';

export const tokenUtils = {
  // Save token to localStorage
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // Get token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Remove token from localStorage
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Check if token exists
  hasToken: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Save tenant context
  setTenantId: (tenantId: string) => {
    localStorage.setItem(TENANT_ID_KEY, tenantId);
  },

  getTenantId: (): string | null => {
    return localStorage.getItem(TENANT_ID_KEY);
  },

  removeTenantId: () => {
    localStorage.removeItem(TENANT_ID_KEY);
  },

  // Save user ID
  setUserId: (userId: string) => {
    localStorage.setItem(USER_ID_KEY, userId);
  },

  getUserId: (): string | null => {
    return localStorage.getItem(USER_ID_KEY);
  },

  removeUserId: () => {
    localStorage.removeItem(USER_ID_KEY);
  },

  // Clear all auth data
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TENANT_ID_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },

  // Decode JWT token to extract payload (basic implementation)
  decodeToken: (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const decoded = JSON.parse(atob(parts[1]));
      return decoded;
    } catch {
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token: string): boolean => {
    const decoded = tokenUtils.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    // exp is in seconds, Date.now() is in milliseconds
    return Date.now() >= decoded.exp * 1000;
  },
};
