import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Tenant, LoginRequest, RegisterRequest } from '../types';
import { authApi } from '../api/auth';
import { tokenUtils } from '../utils/token';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<void>;
  isAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = tokenUtils.getToken();
        if (storedToken) {
          // Check if token is expired
          if (tokenUtils.isTokenExpired(storedToken)) {
            tokenUtils.clearAll();
          } else {
            setToken(storedToken);
            // Could optionally fetch user details here
            // For now, we trust the token
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for auth errors from API interceptor
  useEffect(() => {
    const handleAuthError = (event: any) => {
      if (event.detail?.code === 'UNAUTHORIZED') {
        logout();
      }
    };

    window.addEventListener('authError', handleAuthError);
    return () => window.removeEventListener('authError', handleAuthError);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(data);
      setUser(response.user);
      setTenant(response.tenant);
      setToken(response.accessToken);

      // Persist to localStorage
      tokenUtils.setToken(response.accessToken);
      tokenUtils.setTenantId(response.tenant.id);
      tokenUtils.setUserId(response.user.id);
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register(data);
      setUser(response.user);
      setTenant(response.tenant);
      setToken(response.accessToken);

      // Persist to localStorage
      tokenUtils.setToken(response.accessToken);
      tokenUtils.setTenantId(response.tenant.id);
      tokenUtils.setUserId(response.user.id);
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setTenant(null);
    setToken(null);
    setError(null);
    tokenUtils.clearAll();
  }, []);

  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  const value: AuthContextType = {
    user,
    tenant,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    error,
    login,
    logout,
    register,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
